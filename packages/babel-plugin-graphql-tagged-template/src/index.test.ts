import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { transformSync } from "@babel/core";
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

  it("queries-development", () => {
    const queries = { key: parse("query($_0:Int){user(offset:$_0){name}}") };

    const result = transform(
      `
      export const queries = {};
    `,
      { schema, queries, development: true },
    );

    expect(result).toMatchInlineSnapshot(`export const queries = {};`);
  });

  it("queries-production", () => {
    const queries = { key: parse("query($_0:Int){user(offset:$_0){name}}", { noLocation: true }) };

    const result = transform(
      `
      export const queries = {};
    `,
      { schema, queries },
    );

    expect(result).toMatchInlineSnapshot(`
      export const queries = Object.assign(Object.create(null), {
        key: JSON.parse(
          '{"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"_0"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}},"directives":[]}],"directives":[],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"user"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"offset"},"value":{"kind":"Variable","name":{"kind":"Name","value":"_0"}}}],"directives":[],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"name"},"arguments":[],"directives":[]}]}}]}}]}',
        ),
      });
    `);
  });
});
