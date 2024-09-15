import { PGlite } from "@electric-sql/pglite";
import { parse as jsonParse } from "@mo36924/json";
import { expect, it } from "vitest";
import { createGraphQLRequestHandler } from "./fetch";
import { buildData as buildPostgresData, buildSchema as buildPostgresSchema, query } from "./postgres";
import { buildSchema } from "./schema";
import { model } from "./test/model";

it("fetch", async () => {
  const schema = buildSchema(model);
  const postgresSchema = buildPostgresSchema(schema);
  const postgresData = buildPostgresData(schema);

  const pg = new PGlite();
  await pg.exec(postgresSchema + postgresData);

  const handler = createGraphQLRequestHandler({
    schema,
    async execute(context) {
      const [sql, values] = query(context);
      const result = await pg.query<any>(sql, values);
      return result.rows[0].data;
    },
  });

  const url = new URL("http://example.com/graphql");

  url.searchParams.append(
    "query",
    /* GraphQL */ `
      {
        class {
          users {
            name
            profile {
              age
              createdAt
            }
          }
        }
      }
    `,
  );

  const res = await handler(new Request(url));
  const text = await res?.text();
  const data = jsonParse(text ?? "{}");

  expect(data).toMatchInlineSnapshot(`
    {
      "class": {
        "users": [
          {
            "name": "name-1",
            "profile": {
              "age": 0,
              "createdAt": 1970-01-01T00:00:00.000Z,
            },
          },
          {
            "name": "name-4",
            "profile": {
              "age": 0,
              "createdAt": 1970-01-01T00:00:00.000Z,
            },
          },
          {
            "name": "name-7",
            "profile": {
              "age": 0,
              "createdAt": 1970-01-01T00:00:00.000Z,
            },
          },
        ],
      },
    }
  `);
});
