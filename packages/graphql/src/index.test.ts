import { expect, it } from "vitest";
import { base, build, fix, parse, print, relation } from "./index";

const model = /* GraphQL */ `
  type User {
    name: String!
    profile: Profile
    classes: Class!
    club: [Club]
  }
  type Profile {
    age: Int
  }
  type Class {
    name: String!
    users: [User!]!
  }
  type Club {
    name: String!
    users: [User!]!
  }
`;

it("fix", () => {
  expect(print(fix(parse(model)))).toMatchInlineSnapshot(`
    "type User {
      name: String!
      profile: Profile
      class: Class!
      clubs: [Club!]!
    }

    type Profile {
      age: Int
    }

    type Class {
      name: String!
      users: [User!]!
    }

    type Club {
      name: String!
      users: [User!]!
    }
    "
  `);
});

it("schema", () => {
  expect(build(base(relation(fix(parse(model)))))).toMatchInlineSnapshot(`
    "scalar Date

    scalar JSON

    directive @join on OBJECT

    directive @unique on FIELD_DEFINITION

    directive @key(name: String!) on FIELD_DEFINITION

    directive @ref(name: String!) on FIELD_DEFINITION

    directive @field(name: String!, key: String!) on FIELD_DEFINITION

    directive @type(name: String!, keys: [String!]!) on FIELD_DEFINITION

    type Query {
      user(where: WhereUser, order: OrderUser, offset: Int): User
      users(where: WhereUser, order: OrderUser, limit: Int, offset: Int): [User!]!
      profile(where: WhereProfile, order: OrderProfile, offset: Int): Profile
      profiles(where: WhereProfile, order: OrderProfile, limit: Int, offset: Int): [Profile!]!
      class(where: WhereClass, order: OrderClass, offset: Int): Class
      classes(where: WhereClass, order: OrderClass, limit: Int, offset: Int): [Class!]!
      club(where: WhereClub, order: OrderClub, offset: Int): Club
      clubs(where: WhereClub, order: OrderClub, limit: Int, offset: Int): [Club!]!
    }

    type Mutation {
      create(data: CreateData!): Query!
      update(data: UpdateData!): Query!
      delete(data: DeleteData!): Query!
      read: Query!
    }

    type User {
      id: ID!
      createdAt: Date!
      updatedAt: Date!
      name: String!
      profile(where: WhereProfile): Profile @field(name: "user", key: "userId")
      class(where: WhereClass): Class @key(name: "classId")
      clubs(where: WhereClub, order: OrderClub, limit: Int, offset: Int): [Club!]!
        @type(name: "ClubToUser", keys: ["userId", "clubId"])
      classId: ID @ref(name: "Class")
    }

    type Profile {
      id: ID!
      createdAt: Date!
      updatedAt: Date!
      age: Int
      user(where: WhereUser): User @key(name: "userId")
      userId: ID @ref(name: "User") @unique
    }

    type Class {
      id: ID!
      createdAt: Date!
      updatedAt: Date!
      name: String!
      users(where: WhereUser, order: OrderUser, limit: Int, offset: Int): [User!]! @field(name: "class", key: "classId")
    }

    type Club {
      id: ID!
      createdAt: Date!
      updatedAt: Date!
      name: String!
      users(where: WhereUser, order: OrderUser, limit: Int, offset: Int): [User!]!
        @type(name: "ClubToUser", keys: ["clubId", "userId"])
    }

    type ClubToUser @join {
      id: ID!
      createdAt: Date!
      updatedAt: Date!
      clubId: ID! @ref(name: "Club")
      userId: ID! @ref(name: "User")
    }

    input CreateData {
      user: CreateDataUser
      users: [CreateDataUser!]
      profile: CreateDataProfile
      profiles: [CreateDataProfile!]
      class: CreateDataClass
      classes: [CreateDataClass!]
      club: CreateDataClub
      clubs: [CreateDataClub!]
    }

    input UpdateData {
      user: UpdateDataUser
      users: [UpdateDataUser!]
      profile: UpdateDataProfile
      profiles: [UpdateDataProfile!]
      class: UpdateDataClass
      classes: [UpdateDataClass!]
      club: UpdateDataClub
      clubs: [UpdateDataClub!]
    }

    input DeleteData {
      user: DeleteDataUser
      users: [DeleteDataUser!]
      profile: DeleteDataProfile
      profiles: [DeleteDataProfile!]
      class: DeleteDataClass
      classes: [DeleteDataClass!]
      club: DeleteDataClub
      clubs: [DeleteDataClub!]
    }

    input CreateDataUser {
      name: String!
      profile: CreateDataProfile
      class: CreateDataClass
      clubs: [CreateDataClub!]
    }

    input CreateDataProfile {
      age: Int
      user: CreateDataUser
    }

    input CreateDataClass {
      name: String!
      users: [CreateDataUser!]
    }

    input CreateDataClub {
      name: String!
      users: [CreateDataUser!]
    }

    input UpdateDataUser {
      id: ID!
      name: String
      profile: UpdateDataProfile
      class: UpdateDataClass
      clubs: [UpdateDataClub!]
    }

    input UpdateDataProfile {
      id: ID!
      age: Int
      user: UpdateDataUser
    }

    input UpdateDataClass {
      id: ID!
      name: String
      users: [UpdateDataUser!]
    }

    input UpdateDataClub {
      id: ID!
      name: String
      users: [UpdateDataUser!]
    }

    input DeleteDataUser {
      id: ID!
      profile: DeleteDataProfile
      class: DeleteDataClass
      clubs: [DeleteDataClub!]
    }

    input DeleteDataProfile {
      id: ID!
      user: DeleteDataUser
    }

    input DeleteDataClass {
      id: ID!
      users: [DeleteDataUser!]
    }

    input DeleteDataClub {
      id: ID!
      users: [DeleteDataUser!]
    }

    input WhereUser {
      id: WhereID
      createdAt: WhereDate
      updatedAt: WhereDate
      name: WhereString
      classId: WhereID
      and: WhereUser
      or: WhereUser
      not: WhereUser
    }

    input WhereProfile {
      id: WhereID
      createdAt: WhereDate
      updatedAt: WhereDate
      age: WhereInt
      userId: WhereID
      and: WhereProfile
      or: WhereProfile
      not: WhereProfile
    }

    input WhereClass {
      id: WhereID
      createdAt: WhereDate
      updatedAt: WhereDate
      name: WhereString
      and: WhereClass
      or: WhereClass
      not: WhereClass
    }

    input WhereClub {
      id: WhereID
      createdAt: WhereDate
      updatedAt: WhereDate
      name: WhereString
      and: WhereClub
      or: WhereClub
      not: WhereClub
    }

    input WhereID {
      eq: ID
      ne: ID
      gt: ID
      lt: ID
      ge: ID
      le: ID
      in: [ID]
      like: String
    }

    input WhereInt {
      eq: Int
      ne: Int
      gt: Int
      lt: Int
      ge: Int
      le: Int
      in: [Int]
      like: String
    }

    input WhereFloat {
      eq: Float
      ne: Float
      gt: Float
      lt: Float
      ge: Float
      le: Float
      in: [Float]
      like: String
    }

    input WhereString {
      eq: String
      ne: String
      gt: String
      lt: String
      ge: String
      le: String
      in: [String]
      like: String
    }

    input WhereBoolean {
      eq: Boolean
      ne: Boolean
    }

    input WhereDate {
      eq: Date
      ne: Date
      gt: Date
      lt: Date
      ge: Date
      le: Date
      in: [Date]
      like: String
    }

    input WhereJSON {
      eq: JSON
      ne: JSON
      gt: JSON
      lt: JSON
      ge: JSON
      le: JSON
      in: [JSON]
      like: String
    }

    input OrderUser {
      id: Order
      createdAt: Order
      updatedAt: Order
      name: Order
      classId: Order
    }

    input OrderProfile {
      id: Order
      createdAt: Order
      updatedAt: Order
      age: Order
      userId: Order
    }

    input OrderClass {
      id: Order
      createdAt: Order
      updatedAt: Order
      name: Order
    }

    input OrderClub {
      id: Order
      createdAt: Order
      updatedAt: Order
      name: Order
    }

    enum Order {
      asc
      desc
    }
    "
  `);
});
