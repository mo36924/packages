import { buildSchema, GraphQLSchema } from "graphql";

const schema: GraphQLSchema = buildSchema("scalar Unknown");

export default schema;
