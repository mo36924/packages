import prettier from "@prettier/sync";
import { parse, print, stripIgnoredCharacters } from "graphql";

export const formatGraphQL = (graphql: string) =>
  prettier.format(print(parse(stripIgnoredCharacters(graphql))), {
    ...prettier.resolveConfig("index.gql"),
    filepath: "index.gql",
  });

export const formatDeclaration = (path: string, declaration: string) => {
  const formattedDeclaration = prettier.format(declaration, {
    ...prettier.resolveConfig(path),
    filepath: path,
  });

  return formattedDeclaration;
};
