import { createHash } from "node:crypto";
import { dirname, join } from "node:path";
import { env } from "node:process";
import { fileURLToPath } from "node:url";
import { PluginObj, types as t, template } from "@babel/core";
import { declare } from "@babel/helper-plugin-utils";
import { printSchemaWithDirectives } from "@graphql-tools/utils";
import {
  DocumentNode,
  GraphQLInputType,
  GraphQLSchema,
  OperationTypeNode,
  parse,
  stripIgnoredCharacters,
  TypeInfo,
  validate,
  visit,
  visitWithTypeInfo,
} from "graphql";
import documentNodes from "./documents";
import graphqlSchema from "./schema";

export type Options = {
  development?: boolean;
  schema?: GraphQLSchema;
  documents?: { [hash: string]: DocumentNode | undefined };
};

const moduleDir = dirname(fileURLToPath(import.meta.url));
const documentPaths = ["js", "cjs", "ts"].map((extname) => join(moduleDir, `documents.${extname}`));
const schemaPaths = ["js", "cjs", "ts"].map((extname) => join(moduleDir, `schema.${extname}`));

export default declare<Options>(
  (
    _api,
    { development = env.NODE_ENV === "development", schema = graphqlSchema, documents = documentNodes },
  ): PluginObj => {
    return {
      name: "babel-plugin-graphql",
      visitor: {
        Program(path, { filename = "" }) {
          if (documentPaths.includes(filename)) {
            if (development) {
              return;
            }

            for (const statement of path.get("body")) {
              statement.remove();
            }

            path.pushContainer(
              "body",
              template.statement.ast(
                `export default Object.assign(Object.create(null), JSON.parse(${JSON.stringify(JSON.stringify(documents))}))`,
              ),
            );
          } else if (schemaPaths.includes(filename)) {
            for (const statement of path.get("body")) {
              statement.remove();
            }

            const source = printSchemaWithDirectives(schema);
            const documentNode = parse(source, { noLocation: true });

            path.pushContainer(
              "body",
              template.statements.ast(
                `import { buildASTSchema } from "graphql"\nexport default buildASTSchema(JSON.parse(${JSON.stringify(JSON.stringify(documentNode))}))`,
              ),
            );
          }
        },
        TaggedTemplateExpression(path) {
          const {
            tag,
            quasi: { quasis, expressions },
          } = path.node;

          if (!t.isIdentifier(tag, { name: "gql" })) {
            return;
          }

          let query = quasis[0].value.cooked ?? quasis[0].value.raw;

          if (query.trimStart()[0] !== "{") {
            throw path.buildCodeFrameError("Named operation are not allowed");
          }

          for (let i = 0; i < expressions.length; i++) {
            query += `$_${i}${quasis[i + 1].value.cooked ?? quasis[i + 1].value.raw}`;
          }

          let documentNode: DocumentNode;

          try {
            documentNode = parse(query);
          } catch (err) {
            throw path.buildCodeFrameError(String(err));
          }

          const definitions = documentNode.definitions;
          const definition = definitions[0];

          if (definitions.length !== 1 || definition.kind !== "OperationDefinition") {
            throw path.buildCodeFrameError("Only a single operation is allowed");
          }

          if (definition.variableDefinitions?.length) {
            throw path.buildCodeFrameError("Variables are not allowed");
          }

          const field = definition.selectionSet.selections[0];

          if (field.kind !== "Field") {
            throw path.buildCodeFrameError("Only a field is allowed");
          }

          const values: GraphQLInputType[] = [];
          const typeInfo = new TypeInfo(schema);
          const isMutation = !!schema.getMutationType()?.getFields()[field.name.value];
          const operation = isMutation ? OperationTypeNode.MUTATION : OperationTypeNode.QUERY;

          visit(
            { ...definition, operation },
            visitWithTypeInfo(typeInfo, {
              Variable() {
                values.push(typeInfo.getInputType()!);
              },
            }),
          );

          if (values.length) {
            const variables = `(${values.map((value, i) => `$_${i}:${value}`).join()})`;
            query = `${operation}${variables}${query}`;
          } else if (operation === "mutation") {
            query = `${operation}${query}`;
          }

          try {
            documentNode = parse(query, { noLocation: true });
          } catch (err) {
            throw path.buildCodeFrameError(String(err));
          }

          const errors = validate(schema, documentNode);

          if (errors.length) {
            throw path.buildCodeFrameError(errors[0].message);
          }

          query = stripIgnoredCharacters(query);

          const hash = createHash("sha256").update(query).digest("base64url");
          documents[hash] = documentNode;

          const properties: t.ObjectProperty[] = [t.objectProperty(t.identifier("query"), t.stringLiteral(hash))];

          if (expressions.length) {
            properties.push(
              t.objectProperty(
                t.identifier("variables"),
                t.objectExpression(
                  expressions.map((expression, i) =>
                    t.objectProperty(t.identifier(`_${i}`), expression as t.Expression),
                  ),
                ),
              ),
            );
          }

          path.replaceWith(t.objectExpression(properties));
        },
      },
    };
  },
);
