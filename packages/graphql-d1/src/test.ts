import { build } from "@mo36924/graphql/schema";

const model = /* GraphQL */ `
  type Class {
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
`;

export const { schema } = build(model);
