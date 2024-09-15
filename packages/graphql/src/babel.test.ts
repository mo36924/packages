import { transformSync } from "@babel/core";
import { buildSchema } from "graphql";
import { describe, expect, it } from "vitest";
import plugin, { Options } from "./babel";

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

describe("babel-plugin-graphql-tagged-template", () => {
  it("query-development", () => {
    const result = transformSync(
      `
      const offset = 2
      const params = gql\`{
        user(offset: \${offset}) {
          name
        }
      }\`
    `,
      { plugins: [[plugin, { schema, development: true } satisfies Options]] },
    );

    expect(result).toMatchInlineSnapshot(`
      const offset = 2;
      const params = gql({
        query: "query($_0:Int){user(offset:$_0){name}}",
        variables: {
          _0: offset,
        },
      });
    `);
  });

  it("mutation-development", () => {
    const result = transformSync(
      `
      const name = "Bob";
      const params = gql\`{
        create(name: \${name}) {
          name
        }
      }\`
    `,
      { plugins: [[plugin, { schema, development: true } satisfies Options]] },
    );

    expect(result).toMatchInlineSnapshot(`
      const name = "Bob";
      const params = gql({
        query: "mutation($_0:String){create(name:$_0){name}}",
        variables: {
          _0: name,
        },
      });
    `);
  });

  it("query-production", () => {
    const result = transformSync(
      `
      const offset = 2
      const params = gql\`{
        user(offset: \${offset}) {
          name
        }
      }\`
    `,
      { plugins: [[plugin, { schema } satisfies Options]] },
    );

    expect(result).toMatchInlineSnapshot(`
      const offset = 2;
      const params = gql({
        query: "MZIONJPfdcSfgRTbpPCqCnkvaAzcyYYIXMNwjZxFxUYhN",
        variables: {
          _0: offset,
        },
      });
    `);
  });

  it("mutation-production", () => {
    const result = transformSync(
      `
      const name = "Bob";
      const params = gql\`{
        create(name: \${name}) {
          name
        }
      }\`
    `,
      { plugins: [[plugin, { schema } satisfies Options]] },
    );

    expect(result).toMatchInlineSnapshot(`
      const name = "Bob";
      const params = gql({
        query: "DCRtIpAjKDCBdMmYvnfhqPUHkUrFBduCXZxqwzcvPPynj",
        variables: {
          _0: name,
        },
      });
    `);
  });
});
