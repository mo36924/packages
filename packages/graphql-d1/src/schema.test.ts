import { expect, it } from "vitest";
import { exec } from "./db";
import { buildSchema as buildSQLiteSchema } from "./schema";
import { schema } from "./test";

it("buildSchema", async () => {
  const ddl = buildSQLiteSchema(schema);

  await exec(ddl);

  expect(ddl).toMatchInlineSnapshot(`
    "create table "Class" ("id" text not null primary key,"createdAt" integer not null,"updatedAt" integer not null,"name" text not null);
    create table "Club" ("id" text not null primary key,"createdAt" integer not null,"updatedAt" integer not null,"name" text not null);
    create table "Profile" ("id" text not null primary key,"createdAt" integer not null,"updatedAt" integer not null,"age" integer,"userId" text);
    create table "User" ("id" text not null primary key,"createdAt" integer not null,"updatedAt" integer not null,"classId" text,"name" text not null);
    create table "ClubToUser" ("id" text not null primary key,"createdAt" integer not null,"updatedAt" integer not null,"clubId" text not null,"userId" text not null);
    create unique index "Profile_userId" on "Profile" ("userId");
    create index "User_classId" on "User" ("classId");
    create index "ClubToUser_clubId" on "ClubToUser" ("clubId");
    create index "ClubToUser_userId" on "ClubToUser" ("userId");
    "
  `);
});
