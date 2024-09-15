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

const transform = (code: string) => transformSync(code, { plugins: [[plugin, { schema } satisfies Options]] });

describe("babel-plugin-graphql-tagged-template", () => {
  it("query", () => {
    const result = transform(`
      const offset = 2
      const params = gql\`{
        user(offset: \${offset}) {
          name
        }
      }\`
    `);

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

  it("mutation", () => {
    const result = transform(`
      const name = "Bob";
      const params = gql\`{
        create(name: \${name}) {
          name
        }
      }\`
    `);

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
});
