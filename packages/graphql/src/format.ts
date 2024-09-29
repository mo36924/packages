import prettier from "@prettier/sync";
import { parse, print, stripIgnoredCharacters } from "graphql";

export const formatGraphQL = (graphql: string) => {
  const formattedCode = format("index.gql", print(parse(stripIgnoredCharacters(graphql))));
  return formattedCode;
};

export const format = (path: string, declaration: string) => {
  const formattedCode = prettier.format(declaration, {
    ...prettier.resolveConfig(path),
    plugins: [],
    filepath: path,
  });

  return formattedCode;
};
