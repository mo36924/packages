import { readFileSync } from "node:fs";
import { join } from "node:path";
import { cosmiconfigSync, getDefaultSearchPlaces } from "cosmiconfig";
import glob from "fast-glob";
import { buildSchema as buildGraphQLSchema, GraphQLSchema } from "graphql";
import { require } from "tsx/cjs/api";
import { buildSchema } from "./schema";

const moduleName = "graphql";

const searchPlaces = getDefaultSearchPlaces(moduleName);

const loader = (filepath: string) => {
  const config = require(filepath, import.meta.url);
  return config.default || config;
};

const explorerSync = cosmiconfigSync(moduleName, {
  searchPlaces,
  loaders: {
    ".js": loader,
    ".mjs": loader,
    ".ts": loader,
  },
});

export const getConfig = (searchFrom?: string) => explorerSync.search(searchFrom);

export const getSchema = (searchFrom?: string) => {
  const result = getConfig(searchFrom);

  let schemaPath: string | undefined;
  let schema: GraphQLSchema | undefined;

  try {
    if (result && result.config?.schema) {
      schemaPath = join(result.filepath, "..", result.config.schema);
    } else {
      schemaPath = glob
        .globSync("**/schema.gql", { absolute: true, cwd: searchFrom, ignore: ["**/node_modules/**"] })
        .sort()[0];
    }

    if (schemaPath) {
      const model = readFileSync(schemaPath, "utf-8");
      schema = buildSchema(model);
    }
  } catch {}

  schema ??= buildGraphQLSchema("scalar _");

  return schema;
};
