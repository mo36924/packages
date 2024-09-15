import { createHash } from "node:crypto";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { types as t } from "@babel/core";
import { declare } from "@babel/helper-plugin-utils";
import basex from "base-x";
import {
  DocumentNode,
  GraphQLInputType,
  GraphQLSchema,
  parse,
  stripIgnoredCharacters,
  TypeInfo,
  validate,
  visit,
  visitWithTypeInfo,
} from "graphql";

export type Options = {
  schema: GraphQLSchema;
  development?: boolean;
};

const querySet = new Set<string>();

const fetchPath = join(fileURLToPath(import.meta.url), "..", "fetch.");
const fetchPaths = ["js", "cjs", "ts"].map((extname) => fetchPath + extname);
const base52 = basex("ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz");
const hash = (data: string) => base52.encode(createHash("sha256").update(data).digest());

export default declare<Options>((_, { schema, development }) => {
  return {
    name: "babel-plugin-graphql-tagged-template",
    pre(file) {
      if (!fetchPaths.includes(this.filename ?? "")) {
        return;
      }

      const queries = [...querySet];

      file.path.unshiftContainer("body", [
        t.variableDeclaration("const", [
          t.variableDeclarator(
            t.identifier("queries"),
            t.objectExpression(
              queries.map((query) => t.objectProperty(t.identifier(hash(query)), t.identifier(query))),
            ),
          ),
        ]),
      ]);
    },
    visitor: {
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

        const isMutation = !!schema.getMutationType()?.getFields()[field.name.value];
        const operation = isMutation ? "mutation" : "query";
        // @ts-expect-error ignore readonly
        definition.operation = operation;

        const values: GraphQLInputType[] = [];
        const typeInfo = new TypeInfo(schema);

        visit(
          definition,
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

        querySet.add(query);

        const id = development ? query : hash(query);

        const properties: t.ObjectProperty[] = [t.objectProperty(t.identifier("query"), t.stringLiteral(id))];

        if (expressions.length) {
          properties.push(
            t.objectProperty(
              t.identifier("variables"),
              t.objectExpression(
                expressions.map((expression, i) => t.objectProperty(t.identifier(`_${i}`), expression as t.Expression)),
              ),
            ),
          );
        }

        path.replaceWith(t.callExpression(t.identifier(name), [t.objectExpression(properties)]));
      },
    },
  };
});
