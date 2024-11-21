import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { transformFileAsync, transformSync } from "@babel/core";
import { buildSchema, parse } from "graphql";
import { describe, expect, it } from "vitest";
import plugin, { Options } from "./index";

const schema = buildSchema(`
  type Query {
    user(offset: Int): User
  }
  type Mutation {
    create(name: String): User
  }
  type User {
    name: String
  }
`);

const transform = (code: string, options: Options) =>
  transformSync(code, {
    filename: join(fileURLToPath(import.meta.url), "..", "queries.ts"),
    plugins: [[plugin, options]],
  });

describe("babel-plugin-graphql-tagged-template", () => {
  it("query-development", () => {
    const result = transform(
      `
      const offset = 2
      const params = gql\`{
        user(offset: \${offset}) {
          name
        }
      }\`
    `,
      { schema, development: true },
    );

    expect(result).toMatchInlineSnapshot(`
      const offset = 2;
      const params = {
        query: "WB3CpN66RCuW4s8_87g1t7TC8iTyQCqtqjT7Yw82wkE",
        variables: {
          _0: offset,
        },
      };
    `);
  });

  it("mutation-development", () => {
    const result = transform(
      `
      const name = "Bob";
      const params = gql\`{
        create(name: \${name}) {
          name
        }
      }\`
    `,
      { schema, development: true },
    );

    expect(result).toMatchInlineSnapshot(`
      const name = "Bob";
      const params = {
        query: "FX5QgK4OLTRo27Z_zMUyAi9wCa20seT0fW66wxdbke8",
        variables: {
          _0: name,
        },
      };
    `);
  });

  it("query-production", () => {
    const result = transform(
      `
      const offset = 2
      const params = gql\`{
        user(offset: \${offset}) {
          name
        }
      }\`
    `,
      { schema },
    );

    expect(result).toMatchInlineSnapshot(`
      const offset = 2;
      const params = {
        query: "WB3CpN66RCuW4s8_87g1t7TC8iTyQCqtqjT7Yw82wkE",
        variables: {
          _0: offset,
        },
      };
    `);
  });

  it("mutation-production", () => {
    const result = transform(
      `
      const name = "Bob";
      const params = gql\`{
        create(name: \${name}) {
          name
        }
      }\`
    `,
      { schema },
    );

    expect(result).toMatchInlineSnapshot(`
      const name = "Bob";
      const params = {
        query: "FX5QgK4OLTRo27Z_zMUyAi9wCa20seT0fW66wxdbke8",
        variables: {
          _0: name,
        },
      };
    `);
  });

  it("queries", () => {
    const queries = {};

    transform(
      `
      const offset = 2
      const params = gql\`{
        user(offset: \${offset}) {
          name
        }
      }\`
    `,
      { schema, queries },
    );

    expect(queries).toMatchInlineSnapshot(`
      {
        "WB3CpN66RCuW4s8_87g1t7TC8iTyQCqtqjT7Yw82wkE": {
          "definitions": [
            {
              "directives": [],
              "kind": "OperationDefinition",
              "name": undefined,
              "operation": "query",
              "selectionSet": {
                "kind": "SelectionSet",
                "selections": [
                  {
                    "alias": undefined,
                    "arguments": [
                      {
                        "kind": "Argument",
                        "name": {
                          "kind": "Name",
                          "value": "offset",
                        },
                        "value": {
                          "kind": "Variable",
                          "name": {
                            "kind": "Name",
                            "value": "_0",
                          },
                        },
                      },
                    ],
                    "directives": [],
                    "kind": "Field",
                    "name": {
                      "kind": "Name",
                      "value": "user",
                    },
                    "selectionSet": {
                      "kind": "SelectionSet",
                      "selections": [
                        {
                          "alias": undefined,
                          "arguments": [],
                          "directives": [],
                          "kind": "Field",
                          "name": {
                            "kind": "Name",
                            "value": "name",
                          },
                          "selectionSet": undefined,
                        },
                      ],
                    },
                  },
                ],
              },
              "variableDefinitions": [
                {
                  "defaultValue": undefined,
                  "directives": [],
                  "kind": "VariableDefinition",
                  "type": {
                    "kind": "NamedType",
                    "name": {
                      "kind": "Name",
                      "value": "Int",
                    },
                  },
                  "variable": {
                    "kind": "Variable",
                    "name": {
                      "kind": "Name",
                      "value": "_0",
                    },
                  },
                },
              ],
            },
          ],
          "kind": "Document",
        },
      }
    `);
  });

  it("queries-development", async () => {
    const queries = { key: parse("query($_0:Int){user(offset:$_0){name}}", { noLocation: true }) };

    const result = await transformFileAsync(join(fileURLToPath(import.meta.url), "..", "queries.ts"), {
      parserOpts: { plugins: ["typescript"] },
      plugins: [[plugin, { schema, queries, development: true } satisfies Options]],
    });

    expect(result).toMatchInlineSnapshot(`
      import { DocumentNode } from "graphql";
      export type Queries = {
        [key: string]: DocumentNode;
      };

      // @ts-expect-error queries is set to a value by Babel
      export const queries: Queries = (globalThis.__GRAPHQL_QUERIES__ ??= Object.create(null));
    `);
  });

  it("queries-production", async () => {
    const queries = { key: parse("query($_0:Int){user(offset:$_0){name}}", { noLocation: true }) };

    const result = await transformFileAsync(join(fileURLToPath(import.meta.url), "..", "queries.ts"), {
      parserOpts: { plugins: ["typescript"] },
      plugins: [[plugin, { schema, queries } satisfies Options]],
    });

    expect(result).toMatchInlineSnapshot(`
      import { DocumentNode } from "graphql";
      export type Queries = {
        [key: string]: DocumentNode;
      };

      // @ts-expect-error queries is set to a value by Babel
      export const queries: Queries = Object.assign(
        Object.create(null),
        JSON.parse(
          '{"key":{"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"_0"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}},"directives":[]}],"directives":[],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"user"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"offset"},"value":{"kind":"Variable","name":{"kind":"Name","value":"_0"}}}],"directives":[],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"name"},"arguments":[],"directives":[]}]}}]}}]}}',
        ),
      );
    `);
  });

  it("schema-development", async () => {
    const result = await transformFileAsync(join(fileURLToPath(import.meta.url), "..", "schema.ts"), {
      parserOpts: { plugins: ["typescript"] },
      plugins: [[plugin, { schema, development: true } satisfies Options]],
    });

    expect(result).toMatchInlineSnapshot(`
      import { getSchema } from "@mo36924/graphql";
      export const schema = getSchema().schema;
    `);
  });

  it("schema-production", async () => {
    const result = await transformFileAsync(join(fileURLToPath(import.meta.url), "..", "schema.ts"), {
      parserOpts: { plugins: ["typescript"] },
      plugins: [[plugin, { schema } satisfies Options]],
    });

    expect(result).toMatchInlineSnapshot(`
      import { getSchema } from "@mo36924/graphql";
      export const schema = JSON.parse(
        '{"kind":"Document","definitions":[{"kind":"SchemaDefinition","directives":[],"operationTypes":[{"kind":"OperationTypeDefinition","operation":"query","type":{"kind":"NamedType","name":{"kind":"Name","value":"Query"}}},{"kind":"OperationTypeDefinition","operation":"mutation","type":{"kind":"NamedType","name":{"kind":"Name","value":"Mutation"}}}]},{"kind":"ObjectTypeDefinition","name":{"kind":"Name","value":"Query"},"interfaces":[],"directives":[],"fields":[{"kind":"FieldDefinition","name":{"kind":"Name","value":"user"},"arguments":[{"kind":"InputValueDefinition","name":{"kind":"Name","value":"offset"},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}},"directives":[]}],"type":{"kind":"NamedType","name":{"kind":"Name","value":"User"}},"directives":[]}]},{"kind":"ObjectTypeDefinition","name":{"kind":"Name","value":"Mutation"},"interfaces":[],"directives":[],"fields":[{"kind":"FieldDefinition","name":{"kind":"Name","value":"create"},"arguments":[{"kind":"InputValueDefinition","name":{"kind":"Name","value":"name"},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}},"directives":[]}],"type":{"kind":"NamedType","name":{"kind":"Name","value":"User"}},"directives":[]}]},{"kind":"ObjectTypeDefinition","name":{"kind":"Name","value":"User"},"interfaces":[],"directives":[],"fields":[{"kind":"FieldDefinition","name":{"kind":"Name","value":"name"},"arguments":[],"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}},"directives":[]}]}]}',
      );
    `);
  });
});
