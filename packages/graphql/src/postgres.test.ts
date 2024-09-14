import { PGlite } from "@electric-sql/pglite";
import { parse as jsonParse } from "@mo36924/json";
import { parse } from "graphql";
import { buildExecutionContext } from "graphql/execution/execute";
import { expect, it } from "vitest";
import { buildData as buildPostgresData, buildSchema as buildPostgresSchema, query } from "./postgres";
import { buildSchema } from "./schema";
import { model } from "./test/model";

it("postgres", async () => {
  const schema = buildSchema(model);
  const postgresSchema = buildPostgresSchema(schema);
  const postgresData = buildPostgresData(schema);

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

  const [sql, values] = query(context);
  const pg = new PGlite();
  await pg.exec(postgresSchema + postgresData);
  const result = await pg.query<any>(sql, values);

  expect(postgresSchema).toMatchInlineSnapshot(`
    "create table "Class" (
      "id" text not null primary key,
      "createdAt" timestamp(3) with time zone not null,
      "updatedAt" timestamp(3) with time zone not null,
      "name" text not null
    );
    create table "Club" (
      "id" text not null primary key,
      "createdAt" timestamp(3) with time zone not null,
      "updatedAt" timestamp(3) with time zone not null,
      "name" text not null
    );
    create table "Profile" (
      "id" text not null primary key,
      "createdAt" timestamp(3) with time zone not null,
      "updatedAt" timestamp(3) with time zone not null,
      "age" integer,
      "userId" text
    );
    create table "User" (
      "id" text not null primary key,
      "createdAt" timestamp(3) with time zone not null,
      "updatedAt" timestamp(3) with time zone not null,
      "classId" text,
      "name" text not null
    );
    create table "ClubToUser" (
      "id" text not null primary key,
      "createdAt" timestamp(3) with time zone not null,
      "updatedAt" timestamp(3) with time zone not null,
      "clubId" text not null,
      "userId" text not null
    );
    create unique index "Profile_userId" on "Profile" ("userId");
    create index "User_classId" on "User" ("classId");
    create index "ClubToUser_clubId" on "ClubToUser" ("clubId");
    create index "ClubToUser_userId" on "ClubToUser" ("userId");
    "
  `);

  expect(postgresData).toMatchInlineSnapshot(`
    "insert into "Class" ("id","createdAt","updatedAt","name") values 
    ('Class-id-1','1970-01-01 00:00:00.000','1970-01-01 00:00:00.000','name-1'),
    ('Class-id-2','1970-01-01 00:00:00.000','1970-01-01 00:00:00.000','name-2'),
    ('Class-id-3','1970-01-01 00:00:00.000','1970-01-01 00:00:00.000','name-3');
    insert into "Club" ("id","createdAt","updatedAt","name") values 
    ('Club-id-1','1970-01-01 00:00:00.000','1970-01-01 00:00:00.000','name-1'),
    ('Club-id-2','1970-01-01 00:00:00.000','1970-01-01 00:00:00.000','name-2'),
    ('Club-id-3','1970-01-01 00:00:00.000','1970-01-01 00:00:00.000','name-3');
    insert into "Profile" ("id","createdAt","updatedAt","age","userId") values 
    ('Profile-id-1','1970-01-01 00:00:00.000','1970-01-01 00:00:00.000',0,'User-id-1'),
    ('Profile-id-2','1970-01-01 00:00:00.000','1970-01-01 00:00:00.000',0,'User-id-2'),
    ('Profile-id-3','1970-01-01 00:00:00.000','1970-01-01 00:00:00.000',0,'User-id-3'),
    ('Profile-id-4','1970-01-01 00:00:00.000','1970-01-01 00:00:00.000',0,'User-id-4'),
    ('Profile-id-5','1970-01-01 00:00:00.000','1970-01-01 00:00:00.000',0,'User-id-5'),
    ('Profile-id-6','1970-01-01 00:00:00.000','1970-01-01 00:00:00.000',0,'User-id-6'),
    ('Profile-id-7','1970-01-01 00:00:00.000','1970-01-01 00:00:00.000',0,'User-id-7'),
    ('Profile-id-8','1970-01-01 00:00:00.000','1970-01-01 00:00:00.000',0,'User-id-8'),
    ('Profile-id-9','1970-01-01 00:00:00.000','1970-01-01 00:00:00.000',0,'User-id-9');
    insert into "User" ("id","createdAt","updatedAt","classId","name") values 
    ('User-id-1','1970-01-01 00:00:00.000','1970-01-01 00:00:00.000','Class-id-1','name-1'),
    ('User-id-2','1970-01-01 00:00:00.000','1970-01-01 00:00:00.000','Class-id-2','name-2'),
    ('User-id-3','1970-01-01 00:00:00.000','1970-01-01 00:00:00.000','Class-id-3','name-3'),
    ('User-id-4','1970-01-01 00:00:00.000','1970-01-01 00:00:00.000','Class-id-1','name-4'),
    ('User-id-5','1970-01-01 00:00:00.000','1970-01-01 00:00:00.000','Class-id-2','name-5'),
    ('User-id-6','1970-01-01 00:00:00.000','1970-01-01 00:00:00.000','Class-id-3','name-6'),
    ('User-id-7','1970-01-01 00:00:00.000','1970-01-01 00:00:00.000','Class-id-1','name-7'),
    ('User-id-8','1970-01-01 00:00:00.000','1970-01-01 00:00:00.000','Class-id-2','name-8'),
    ('User-id-9','1970-01-01 00:00:00.000','1970-01-01 00:00:00.000','Class-id-3','name-9');
    insert into "ClubToUser" ("id","createdAt","updatedAt","clubId","userId") values 
    ('ClubToUser-id-1','1970-01-01 00:00:00.000','1970-01-01 00:00:00.000','Club-id-1','User-id-1'),
    ('ClubToUser-id-2','1970-01-01 00:00:00.000','1970-01-01 00:00:00.000','Club-id-2','User-id-2'),
    ('ClubToUser-id-3','1970-01-01 00:00:00.000','1970-01-01 00:00:00.000','Club-id-3','User-id-3'),
    ('ClubToUser-id-4','1970-01-01 00:00:00.000','1970-01-01 00:00:00.000','Club-id-1','User-id-4'),
    ('ClubToUser-id-5','1970-01-01 00:00:00.000','1970-01-01 00:00:00.000','Club-id-2','User-id-5'),
    ('ClubToUser-id-6','1970-01-01 00:00:00.000','1970-01-01 00:00:00.000','Club-id-3','User-id-6'),
    ('ClubToUser-id-7','1970-01-01 00:00:00.000','1970-01-01 00:00:00.000','Club-id-1','User-id-7'),
    ('ClubToUser-id-8','1970-01-01 00:00:00.000','1970-01-01 00:00:00.000','Club-id-2','User-id-8'),
    ('ClubToUser-id-9','1970-01-01 00:00:00.000','1970-01-01 00:00:00.000','Club-id-3','User-id-9'),
    ('ClubToUser-id-10','1970-01-01 00:00:00.000','1970-01-01 00:00:00.000','Club-id-1','User-id-1'),
    ('ClubToUser-id-11','1970-01-01 00:00:00.000','1970-01-01 00:00:00.000','Club-id-2','User-id-2'),
    ('ClubToUser-id-12','1970-01-01 00:00:00.000','1970-01-01 00:00:00.000','Club-id-3','User-id-3'),
    ('ClubToUser-id-13','1970-01-01 00:00:00.000','1970-01-01 00:00:00.000','Club-id-1','User-id-4'),
    ('ClubToUser-id-14','1970-01-01 00:00:00.000','1970-01-01 00:00:00.000','Club-id-2','User-id-5'),
    ('ClubToUser-id-15','1970-01-01 00:00:00.000','1970-01-01 00:00:00.000','Club-id-3','User-id-6'),
    ('ClubToUser-id-16','1970-01-01 00:00:00.000','1970-01-01 00:00:00.000','Club-id-1','User-id-7'),
    ('ClubToUser-id-17','1970-01-01 00:00:00.000','1970-01-01 00:00:00.000','Club-id-2','User-id-8'),
    ('ClubToUser-id-18','1970-01-01 00:00:00.000','1970-01-01 00:00:00.000','Club-id-3','User-id-9'),
    ('ClubToUser-id-19','1970-01-01 00:00:00.000','1970-01-01 00:00:00.000','Club-id-1','User-id-1'),
    ('ClubToUser-id-20','1970-01-01 00:00:00.000','1970-01-01 00:00:00.000','Club-id-2','User-id-2'),
    ('ClubToUser-id-21','1970-01-01 00:00:00.000','1970-01-01 00:00:00.000','Club-id-3','User-id-3'),
    ('ClubToUser-id-22','1970-01-01 00:00:00.000','1970-01-01 00:00:00.000','Club-id-1','User-id-4'),
    ('ClubToUser-id-23','1970-01-01 00:00:00.000','1970-01-01 00:00:00.000','Club-id-2','User-id-5'),
    ('ClubToUser-id-24','1970-01-01 00:00:00.000','1970-01-01 00:00:00.000','Club-id-3','User-id-6'),
    ('ClubToUser-id-25','1970-01-01 00:00:00.000','1970-01-01 00:00:00.000','Club-id-1','User-id-7'),
    ('ClubToUser-id-26','1970-01-01 00:00:00.000','1970-01-01 00:00:00.000','Club-id-2','User-id-8'),
    ('ClubToUser-id-27','1970-01-01 00:00:00.000','1970-01-01 00:00:00.000','Club-id-3','User-id-9');
    "
  `);

  expect(jsonParse(result.rows[0].data)).toMatchInlineSnapshot(`
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
