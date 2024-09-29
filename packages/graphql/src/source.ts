import { GraphQLSchema } from "graphql";

export const getSource = (schema: GraphQLSchema) => {
  const source = schema.getQueryType()?.astNode?.loc?.source.body;

  if (!source) {
    throw new Error("Failed to get source from schema");
  }

  return source;
};
