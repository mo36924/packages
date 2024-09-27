import { GraphQLSchema } from "graphql";

export const getSource = (schema: GraphQLSchema) => {
  const source = schema.getQueryType()?.astNode?.loc?.source.body ?? "";
  return source;
};
