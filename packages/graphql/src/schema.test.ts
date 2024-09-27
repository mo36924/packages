import { expect, it } from "vitest";
import { formatGraphQL } from "./format";
import { buildSchema } from "./schema";
import { getSource } from "./source";
import { model } from "./test/model";

it("buildSchema", () => {
  const schema = buildSchema(model);
  const source = getSource(schema);
  const formattedSource = formatGraphQL(source);

  expect(formattedSource).toMatchInlineSnapshot(`
    "scalar Date

    scalar JSON

    directive @join on OBJECT

    directive @unique on FIELD_DEFINITION

    directive @key(name: String!) on FIELD_DEFINITION

    directive @ref(name: String!) on FIELD_DEFINITION

    directive @field(name: String!, key: String!) on FIELD_DEFINITION

    directive @type(name: String!, keys: [String!]!) on FIELD_DEFINITION

    type Query {
      class(where: WhereClass, order: OrderClass, offset: Int): Class
      classes(where: WhereClass, order: OrderClass, limit: Int, offset: Int): [Class!]!
      club(where: WhereClub, order: OrderClub, offset: Int): Club
      clubs(where: WhereClub, order: OrderClub, limit: Int, offset: Int): [Club!]!
      profile(where: WhereProfile, order: OrderProfile, offset: Int): Profile
      profiles(where: WhereProfile, order: OrderProfile, limit: Int, offset: Int): [Profile!]!
      user(where: WhereUser, order: OrderUser, offset: Int): User
      users(where: WhereUser, order: OrderUser, limit: Int, offset: Int): [User!]!
    }

    type Mutation {
      create(data: CreateData!): Query!
      update(data: UpdateData!): Query!
      delete(data: DeleteData!): Query!
      read: Query!
    }

    type Class {
      id: String!
      createdAt: Date!
      updatedAt: Date!
      name: String!
      users(where: WhereUser, order: OrderUser, limit: Int, offset: Int): [User!]! @field(name: "class", key: "classId")
    }

    type Club {
      id: String!
      createdAt: Date!
      updatedAt: Date!
      name: String!
      users(where: WhereUser, order: OrderUser, limit: Int, offset: Int): [User!]!
        @type(name: "ClubToUser", keys: ["clubId", "userId"])
    }

    type Profile {
      id: String!
      createdAt: Date!
      updatedAt: Date!
      age: Int
      user(where: WhereUser): User @key(name: "userId")
      userId: String @ref(name: "User") @unique
    }

    type User {
      id: String!
      createdAt: Date!
      updatedAt: Date!
      class(where: WhereClass): Class @key(name: "classId")
      classId: String @ref(name: "Class")
      clubs(where: WhereClub, order: OrderClub, limit: Int, offset: Int): [Club!]!
        @type(name: "ClubToUser", keys: ["userId", "clubId"])
      name: String!
      profile(where: WhereProfile): Profile @field(name: "user", key: "userId")
    }

    type ClubToUser @join {
      id: String!
      createdAt: Date!
      updatedAt: Date!
      clubId: String! @ref(name: "Club")
      userId: String! @ref(name: "User")
    }

    input CreateData {
      class: CreateDataClass
      classes: [CreateDataClass!]
      club: CreateDataClub
      clubs: [CreateDataClub!]
      profile: CreateDataProfile
      profiles: [CreateDataProfile!]
      user: CreateDataUser
      users: [CreateDataUser!]
    }

    input UpdateData {
      class: UpdateDataClass
      classes: [UpdateDataClass!]
      club: UpdateDataClub
      clubs: [UpdateDataClub!]
      profile: UpdateDataProfile
      profiles: [UpdateDataProfile!]
      user: UpdateDataUser
      users: [UpdateDataUser!]
    }

    input DeleteData {
      class: DeleteDataClass
      classes: [DeleteDataClass!]
      club: DeleteDataClub
      clubs: [DeleteDataClub!]
      profile: DeleteDataProfile
      profiles: [DeleteDataProfile!]
      user: DeleteDataUser
      users: [DeleteDataUser!]
    }

    input CreateDataClass {
      name: String!
      users: [CreateDataUser!]
    }

    input CreateDataClub {
      name: String!
      users: [CreateDataUser!]
    }

    input CreateDataProfile {
      age: Int
      user: CreateDataUser
    }

    input CreateDataUser {
      class: CreateDataClass
      clubs: [CreateDataClub!]
      name: String!
      profile: CreateDataProfile
    }

    input UpdateDataClass {
      id: String!
      name: String
      users: [UpdateDataUser!]
    }

    input UpdateDataClub {
      id: String!
      name: String
      users: [UpdateDataUser!]
    }

    input UpdateDataProfile {
      id: String!
      age: Int
      user: UpdateDataUser
    }

    input UpdateDataUser {
      id: String!
      class: UpdateDataClass
      clubs: [UpdateDataClub!]
      name: String
      profile: UpdateDataProfile
    }

    input DeleteDataClass {
      id: String!
      users: [DeleteDataUser!]
    }

    input DeleteDataClub {
      id: String!
      users: [DeleteDataUser!]
    }

    input DeleteDataProfile {
      id: String!
      user: DeleteDataUser
    }

    input DeleteDataUser {
      id: String!
      class: DeleteDataClass
      clubs: [DeleteDataClub!]
      profile: DeleteDataProfile
    }

    input WhereClass {
      id: WhereString
      createdAt: WhereDate
      updatedAt: WhereDate
      name: WhereString
      and: WhereClass
      or: WhereClass
      not: WhereClass
    }

    input WhereClub {
      id: WhereString
      createdAt: WhereDate
      updatedAt: WhereDate
      name: WhereString
      and: WhereClub
      or: WhereClub
      not: WhereClub
    }

    input WhereProfile {
      id: WhereString
      createdAt: WhereDate
      updatedAt: WhereDate
      age: WhereInt
      userId: WhereString
      and: WhereProfile
      or: WhereProfile
      not: WhereProfile
    }

    input WhereUser {
      id: WhereString
      createdAt: WhereDate
      updatedAt: WhereDate
      classId: WhereString
      name: WhereString
      and: WhereUser
      or: WhereUser
      not: WhereUser
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

    input OrderProfile {
      id: Order
      createdAt: Order
      updatedAt: Order
      age: Order
      userId: Order
    }

    input OrderUser {
      id: Order
      createdAt: Order
      updatedAt: Order
      classId: Order
      name: Order
    }

    enum Order {
      asc
      desc
    }
    "
  `);
});
