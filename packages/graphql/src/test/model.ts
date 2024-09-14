export const model = /* GraphQL */ `
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
