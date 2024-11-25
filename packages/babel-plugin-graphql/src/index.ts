import { createHash } from "node:crypto";
import { dirname, join } from "node:path";
import { env } from "node:process";
import { fileURLToPath } from "node:url";
import { PluginObj, types as t } from "@babel/core";
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
import { queries as _queries, Queries } from "./queries";
import { schema as _schema } from "./schema";

export type Options = {
  development?: boolean;
  schema?: GraphQLSchema;
  queries?: Queries;
};

const queriesDir = dirname(fileURLToPath(import.meta.url));
const queriesPaths = ["js", "cjs", "ts"].map((extname) => join(queriesDir, `queries.${extname}`));
const schemaPaths = ["js", "cjs", "ts"].map((extname) => join(queriesDir, `schema.${extname}`));
const hash = (data: string) => createHash("sha256").update(data).digest("base64url");

export default declare<Options>(
  (_api, { development = env.NODE_ENV === "development", schema = _schema, queries = _queries }): PluginObj => {
    return {
      name: "babel-plugin-graphql-tagged-template",
      visitor: {
        ...(development
          ? {}
          : {
              VariableDeclarator(path, { filename = "" }) {
                if (queriesPaths.includes(filename) && path.get("id").isIdentifier({ name: "queries" })) {
                  const sortedQueries = Object.fromEntries(
                    Object.entries(queries).sort(([a], [b]) => a.localeCompare(b)),
                  );

                  path
                    .get("init")
                    .replaceWith(
                      t.callExpression(t.memberExpression(t.identifier("Object"), t.identifier("assign")), [
                        t.callExpression(t.memberExpression(t.identifier("Object"), t.identifier("create")), [
                          t.nullLiteral(),
                        ]),
                        t.callExpression(t.memberExpression(t.identifier("JSON"), t.identifier("parse")), [
                          t.stringLiteral(JSON.stringify(sortedQueries)),
                        ]),
                      ]),
                    );
                } else if (schemaPaths.includes(filename) && path.get("id").isIdentifier({ name: "schema" })) {
                  const source = printSchemaWithDirectives(schema);
                  const documentNode = parse(source, { noLocation: true });

                  path
                    .get("init")
                    .replaceWith(
                      t.callExpression(t.memberExpression(t.identifier("JSON"), t.identifier("parse")), [
                        t.stringLiteral(JSON.stringify(documentNode)),
                      ]),
                    );
                }
              },
            }),
        TaggedTemplateExpression(path) {
          const {
            tag,
            quasi: { quasis, expressions },
          } = path.node;

          if (!t.isIdentifier(tag)) {
            return;
          }

          const name = tag.name;

          if (name !== "gql") {
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

          const key = hash(query);
          queries[key] = documentNode;

          const properties: t.ObjectProperty[] = [t.objectProperty(t.identifier("query"), t.stringLiteral(key))];

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