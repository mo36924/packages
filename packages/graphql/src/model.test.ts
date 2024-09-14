import { expect, it } from "vitest";
import { buildModel, fixModel } from "./model";
import { model } from "./test/model";

it("fixModel", () => {
  expect(fixModel(model)).toMatchInlineSnapshot(`
    "type Class {
      name: String!
      users: [User!]!
    }

    type Club {
      name: String!
      users: [User!]!
    }

    type Profile {
      age: Int
    }

    type User {
      class: Class!
      clubs: [Club!]!
      name: String!
      profile: Profile
    }
    "
  `);
});

it("buildModel", () => {
  expect(buildModel(model)).toMatchInlineSnapshot(`
    "scalar Date

    scalar JSON

    directive @join on OBJECT

    directive @unique on FIELD_DEFINITION

    directive @key(name: String!) on FIELD_DEFINITION

    directive @ref(name: String!) on FIELD_DEFINITION

    directive @field(name: String!, key: String!) on FIELD_DEFINITION

    directive @type(name: String!, keys: [String!]!) on FIELD_DEFINITION

    type Class {
      id: String!
      createdAt: Date!
      updatedAt: Date!
      name: String!
      users: [User!]! @field(name: "class", key: "classId")
    }

    type Club {
      id: String!
      createdAt: Date!
      updatedAt: Date!
      name: String!
      users: [User!]! @type(name: "ClubToUser", keys: ["clubId", "userId"])
    }

    type Profile {
      id: String!
      createdAt: Date!
      updatedAt: Date!
      age: Int
      user: User @key(name: "userId")
      userId: String @ref(name: "User") @unique
    }

    type User {
      id: String!
      createdAt: Date!
      updatedAt: Date!
      class: Class @key(name: "classId")
      classId: String @ref(name: "Class")
      clubs: [Club!]! @type(name: "ClubToUser", keys: ["userId", "clubId"])
      name: String!
      profile: Profile @field(name: "user", key: "userId")
    }

    type ClubToUser @join {
      id: String!
      createdAt: Date!
      updatedAt: Date!
      clubId: String! @ref(name: "Club")
      userId: String! @ref(name: "User")
    }
    "
  `);
});
