import { expect, test } from "vitest";
import { base, build, fix, parse, relation, sort } from "./index";

test("build", () => {
  const types = parse(/* GraphQL */ `
    type User {
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
  `);

  const schema = build(sort(base(relation(fix(types)))));

  expect(schema).toMatchInlineSnapshot(`
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
      id: ID!
      version: Int!
      createdAt: Date!
      updatedAt: Date!
      name: String!
      users(where: WhereUser, order: OrderUser, limit: Int, offset: Int): [User!]! @field(name: \\"class\\", key: \\"classId\\")
    }

    type Club {
      id: ID!
      version: Int!
      createdAt: Date!
      updatedAt: Date!
      name: String!
      users(where: WhereUser, order: OrderUser, limit: Int, offset: Int): [User!]! @type(name: \\"ClubToUser\\", keys: [\\"clubId\\", \\"userId\\"])
    }

    type Profile {
      id: ID!
      version: Int!
      createdAt: Date!
      updatedAt: Date!
      age: Int
      user(where: WhereUser): User @key(name: \\"userId\\")
      userId: ID @ref(name: \\"User\\") @unique
    }

    type User {
      id: ID!
      version: Int!
      createdAt: Date!
      updatedAt: Date!
      class(where: WhereClass): Class @key(name: \\"classId\\")
      classId: ID @ref(name: \\"Class\\")
      clubs(where: WhereClub, order: OrderClub, limit: Int, offset: Int): [Club!]! @type(name: \\"ClubToUser\\", keys: [\\"userId\\", \\"clubId\\"])
      name: String!
      profile(where: WhereProfile): Profile @field(name: \\"user\\", key: \\"userId\\")
    }

    type ClubToUser @join {
      id: ID!
      version: Int!
      createdAt: Date!
      updatedAt: Date!
      clubId: ID! @ref(name: \\"Club\\")
      userId: ID! @ref(name: \\"User\\")
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
      id: ID!
      version: Int!
      name: String
      users: [UpdateDataUser!]
    }

    input UpdateDataClub {
      id: ID!
      version: Int!
      name: String
      users: [UpdateDataUser!]
    }

    input UpdateDataProfile {
      id: ID!
      version: Int!
      age: Int
      user: UpdateDataUser
    }

    input UpdateDataUser {
      id: ID!
      version: Int!
      class: UpdateDataClass
      clubs: [UpdateDataClub!]
      name: String
      profile: UpdateDataProfile
    }

    input DeleteDataClass {
      id: ID!
      version: Int!
      users: [DeleteDataUser!]
    }

    input DeleteDataClub {
      id: ID!
      version: Int!
      users: [DeleteDataUser!]
    }

    input DeleteDataProfile {
      id: ID!
      version: Int!
      user: DeleteDataUser
    }

    input DeleteDataUser {
      id: ID!
      version: Int!
      class: DeleteDataClass
      clubs: [DeleteDataClub!]
      profile: DeleteDataProfile
    }

    input WhereClass {
      id: WhereID
      version: WhereInt
      createdAt: WhereDate
      updatedAt: WhereDate
      name: WhereString
      and: WhereClass
      or: WhereClass
      not: WhereClass
    }

    input WhereClub {
      id: WhereID
      version: WhereInt
      createdAt: WhereDate
      updatedAt: WhereDate
      name: WhereString
      and: WhereClub
      or: WhereClub
      not: WhereClub
    }

    input WhereProfile {
      id: WhereID
      version: WhereInt
      createdAt: WhereDate
      updatedAt: WhereDate
      age: WhereInt
      userId: WhereID
      and: WhereProfile
      or: WhereProfile
      not: WhereProfile
    }

    input WhereUser {
      id: WhereID
      version: WhereInt
      createdAt: WhereDate
      updatedAt: WhereDate
      classId: WhereID
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
      version: Order
      createdAt: Order
      updatedAt: Order
      name: Order
    }

    input OrderClub {
      id: Order
      version: Order
      createdAt: Order
      updatedAt: Order
      name: Order
    }

    input OrderProfile {
      id: Order
      version: Order
      createdAt: Order
      updatedAt: Order
      age: Order
      userId: Order
    }

    input OrderUser {
      id: Order
      version: Order
      createdAt: Order
      updatedAt: Order
      classId: Order
      name: Order
    }

    enum Order {
      asc
      desc
    }"
  `);
});
