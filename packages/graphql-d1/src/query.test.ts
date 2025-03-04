import { parse as jsonParse } from "@mo36924/json";
import { parse } from "graphql";
import { buildExecutionContext } from "graphql/execution/execute";
import { expect, it } from "vitest";
import { buildData } from "./data";
import { connect } from "./db";
import { buildQuery } from "./query";
import { buildSchema as buildSQLiteSchema } from "./schema";
import { schema } from "./test";

it("query", async () => {
  const ddl = buildSQLiteSchema(schema);
  const dml = buildData(schema);

  const context = buildExecutionContext({
    schema,
    document: parse(/* GraphQL */ `
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
    `),
  });

  if (!("schema" in context)) {
    throw context[0];
  }

  const [sql, values] = buildQuery(context);

  const data = await connect(async (db) => {
    await db.exec(ddl + dml);

    const data = await db
      .prepare(sql)
      .bind(...values)
      .first<any>("data");

    return data;
  });

  expect(JSON.parse(data)).toMatchInlineSnapshot(`
    {
      "class": {
        "users": [
          {
            "name": "0name-1",
            "profile": {
              "age": 0,
              "createdAt": "11970-01-01T00:00:00.000Z",
            },
          },
          {
            "name": "0name-4",
            "profile": {
              "age": 0,
              "createdAt": "11970-01-01T00:00:00.000Z",
            },
          },
          {
            "name": "0name-7",
            "profile": {
              "age": 0,
              "createdAt": "11970-01-01T00:00:00.000Z",
            },
          },
        ],
      },
    }
  `);

  expect(jsonParse(data)).toMatchInlineSnapshot(`
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
