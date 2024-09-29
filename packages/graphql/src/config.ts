import { readFileSync } from "node:fs";
import { join } from "node:path";
import { cosmiconfigSync, getDefaultSearchPlaces } from "cosmiconfig";
import glob from "fast-glob";
import { require } from "tsx/cjs/api";
import { build, Result } from "./schema";

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

export const getConfig = (searchFrom?: string) => {
  const result = explorerSync.search(searchFrom);

  let path: string | undefined;
  let buildResult: Result | undefined;

  try {
    if (result && result.config?.schema) {
      path = join(result.filepath, "..", result.config.schema);
    } else {
      path = glob
        .globSync("**/schema.gql", { absolute: true, cwd: searchFrom, ignore: ["**/node_modules/**"] })
        .sort()[0];
    }

    const model = readFileSync(path, "utf-8");
    buildResult = build(model);
  } catch {}

  return { path, ...buildResult };
};
