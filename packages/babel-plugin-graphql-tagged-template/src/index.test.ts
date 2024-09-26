import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { transformSync } from "@babel/core";
import { buildSchema } from "graphql";
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

describe("graphqlTaggedTemplate", () => {
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
        query: "query($_0:Int){user(offset:$_0){name}}",
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
        query: "mutation($_0:String){create(name:$_0){name}}",
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
        query: "MZIONJPfdcSfgRTbpPCqCnkvaAzcyYYIXMNwjZxFxUYhN",
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
        query: "DCRtIpAjKDCBdMmYvnfhqPUHkUrFBduCXZxqwzcvPPynj",
        variables: {
          _0: name,
        },
      };
    `);
  });

  it("queries", () => {
    const result = transform(
      `
      export const queries = {};
    `,
      { schema, queries: ["query($_0:Int){user(offset:$_0){name}}"] },
    );

    expect(result).toMatchInlineSnapshot(`
      export const queries = {
        MZIONJPfdcSfgRTbpPCqCnkvaAzcyYYIXMNwjZxFxUYhN: JSON.parse(
          '{"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"_0"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}},"directives":[]}],"directives":[],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"user"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"offset"},"value":{"kind":"Variable","name":{"kind":"Name","value":"_0"}}}],"directives":[],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"name"},"arguments":[],"directives":[]}]}}]}}]}',
        ),
      };
    `);
  });
});
