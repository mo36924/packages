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

const transform = (code: string, options?: Omit<Options, "schema">) =>
  transformSync(code, {
    plugins: [[plugin, { schema, ...options } satisfies Options]],
  });

describe("babel-plugin-graphql", () => {
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
      { development: true },
    );

    expect(result).toMatchInlineSnapshot(`
      const offset = 2;
      const params = {
        query: "WB3CpN66RCuW4s8_87g1t7TC8iTyQCqtqjT7Yw82wkE",
        variables: {
          _0: offset
        }
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
      { development: true },
    );

    expect(result).toMatchInlineSnapshot(`
      const name = "Bob";
      const params = {
        query: "FX5QgK4OLTRo27Z_zMUyAi9wCa20seT0fW66wxdbke8",
        variables: {
          _0: name
        }
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
    );

    expect(result).toMatchInlineSnapshot(`
      const offset = 2;
      const params = {
        query: "WB3CpN66RCuW4s8_87g1t7TC8iTyQCqtqjT7Yw82wkE",
        variables: {
          _0: offset
        }
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
    );

    expect(result).toMatchInlineSnapshot(`
      const name = "Bob";
      const params = {
        query: "FX5QgK4OLTRo27Z_zMUyAi9wCa20seT0fW66wxdbke8",
        variables: {
          _0: name
        }
      };
    `);
  });

  it("documents", () => {
    const documents = {};

    transform(
      `
      const offset = 2
      const params = gql\`{
        user(offset: \${offset}) {
          name
        }
      }\`
    `,
      { documents },
    );

    expect(documents).toMatchInlineSnapshot(`
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

  it("documents-development", async () => {
    const documents = { key: parse("query($_0:Int){user(offset:$_0){name}}", { noLocation: true }) };

    const result = await transformFileAsync(join(fileURLToPath(import.meta.url), "..", "documents.ts"), {
      parserOpts: { plugins: ["typescript"] },
      plugins: [[plugin, { schema, documents, development: true } satisfies Options]],
    });

    expect(result).toMatchInlineSnapshot(`
      import { DocumentNode } from "graphql";
      const documents: {
        [hash: string]: DocumentNode | undefined;
      } = Object.create(null);
      export default documents;
    `);
  });

  it("documents-production", async () => {
    const documents = { key: parse("query($_0:Int){user(offset:$_0){name}}", { noLocation: true }) };

    const result = await transformFileAsync(join(fileURLToPath(import.meta.url), "..", "documents.ts"), {
      parserOpts: { plugins: ["typescript"] },
      plugins: [[plugin, { schema, documents } satisfies Options]],
    });

    expect(result).toMatchInlineSnapshot(
      `export default Object.assign(Object.create(null), JSON.parse("{\\"key\\":{\\"kind\\":\\"Document\\",\\"definitions\\":[{\\"kind\\":\\"OperationDefinition\\",\\"operation\\":\\"query\\",\\"variableDefinitions\\":[{\\"kind\\":\\"VariableDefinition\\",\\"variable\\":{\\"kind\\":\\"Variable\\",\\"name\\":{\\"kind\\":\\"Name\\",\\"value\\":\\"_0\\"}},\\"type\\":{\\"kind\\":\\"NamedType\\",\\"name\\":{\\"kind\\":\\"Name\\",\\"value\\":\\"Int\\"}},\\"directives\\":[]}],\\"directives\\":[],\\"selectionSet\\":{\\"kind\\":\\"SelectionSet\\",\\"selections\\":[{\\"kind\\":\\"Field\\",\\"name\\":{\\"kind\\":\\"Name\\",\\"value\\":\\"user\\"},\\"arguments\\":[{\\"kind\\":\\"Argument\\",\\"name\\":{\\"kind\\":\\"Name\\",\\"value\\":\\"offset\\"},\\"value\\":{\\"kind\\":\\"Variable\\",\\"name\\":{\\"kind\\":\\"Name\\",\\"value\\":\\"_0\\"}}}],\\"directives\\":[],\\"selectionSet\\":{\\"kind\\":\\"SelectionSet\\",\\"selections\\":[{\\"kind\\":\\"Field\\",\\"name\\":{\\"kind\\":\\"Name\\",\\"value\\":\\"name\\"},\\"arguments\\":[],\\"directives\\":[]}]}}]}}]}}"));`,
    );
  });

  it("schema", async () => {
    const result = await transformFileAsync(join(fileURLToPath(import.meta.url), "..", "schema.ts"), {
      parserOpts: { plugins: ["typescript"] },
      plugins: [[plugin, { schema, development: true } satisfies Options]],
    });

    expect(result).toMatchInlineSnapshot(`
      import { buildASTSchema } from "graphql";
      import { mergeCustomScalars } from "@mo36924/graphql/merge";
      export default mergeCustomScalars(buildASTSchema(JSON.parse("{\\"kind\\":\\"Document\\",\\"definitions\\":[{\\"kind\\":\\"SchemaDefinition\\",\\"directives\\":[],\\"operationTypes\\":[{\\"kind\\":\\"OperationTypeDefinition\\",\\"operation\\":\\"query\\",\\"type\\":{\\"kind\\":\\"NamedType\\",\\"name\\":{\\"kind\\":\\"Name\\",\\"value\\":\\"Query\\"}}},{\\"kind\\":\\"OperationTypeDefinition\\",\\"operation\\":\\"mutation\\",\\"type\\":{\\"kind\\":\\"NamedType\\",\\"name\\":{\\"kind\\":\\"Name\\",\\"value\\":\\"Mutation\\"}}}]},{\\"kind\\":\\"ObjectTypeDefinition\\",\\"name\\":{\\"kind\\":\\"Name\\",\\"value\\":\\"Query\\"},\\"interfaces\\":[],\\"directives\\":[],\\"fields\\":[{\\"kind\\":\\"FieldDefinition\\",\\"name\\":{\\"kind\\":\\"Name\\",\\"value\\":\\"user\\"},\\"arguments\\":[{\\"kind\\":\\"InputValueDefinition\\",\\"name\\":{\\"kind\\":\\"Name\\",\\"value\\":\\"offset\\"},\\"type\\":{\\"kind\\":\\"NamedType\\",\\"name\\":{\\"kind\\":\\"Name\\",\\"value\\":\\"Int\\"}},\\"directives\\":[]}],\\"type\\":{\\"kind\\":\\"NamedType\\",\\"name\\":{\\"kind\\":\\"Name\\",\\"value\\":\\"User\\"}},\\"directives\\":[]}]},{\\"kind\\":\\"ObjectTypeDefinition\\",\\"name\\":{\\"kind\\":\\"Name\\",\\"value\\":\\"Mutation\\"},\\"interfaces\\":[],\\"directives\\":[],\\"fields\\":[{\\"kind\\":\\"FieldDefinition\\",\\"name\\":{\\"kind\\":\\"Name\\",\\"value\\":\\"create\\"},\\"arguments\\":[{\\"kind\\":\\"InputValueDefinition\\",\\"name\\":{\\"kind\\":\\"Name\\",\\"value\\":\\"name\\"},\\"type\\":{\\"kind\\":\\"NamedType\\",\\"name\\":{\\"kind\\":\\"Name\\",\\"value\\":\\"String\\"}},\\"directives\\":[]}],\\"type\\":{\\"kind\\":\\"NamedType\\",\\"name\\":{\\"kind\\":\\"Name\\",\\"value\\":\\"User\\"}},\\"directives\\":[]}]},{\\"kind\\":\\"ObjectTypeDefinition\\",\\"name\\":{\\"kind\\":\\"Name\\",\\"value\\":\\"User\\"},\\"interfaces\\":[],\\"directives\\":[],\\"fields\\":[{\\"kind\\":\\"FieldDefinition\\",\\"name\\":{\\"kind\\":\\"Name\\",\\"value\\":\\"name\\"},\\"arguments\\":[],\\"type\\":{\\"kind\\":\\"NamedType\\",\\"name\\":{\\"kind\\":\\"Name\\",\\"value\\":\\"String\\"}},\\"directives\\":[]}]}]}")));
    `);
  });
});
