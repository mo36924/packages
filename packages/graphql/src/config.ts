import { readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { cwd } from "node:process";
import { cosmiconfigSync, getDefaultSearchPlaces } from "cosmiconfig";
import glob from "fast-glob";
import { buildSchema } from "graphql";
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

const defaultSchema = buildSchema("scalar _");

export const getConfig = (searchFrom: string = cwd()) => {
  const result = explorerSync.search(searchFrom);

  let path: string | undefined;
  let dts = "graphql.d.ts";
  let buildResult: Result | undefined;

  try {
    if (result?.config?.schema) {
      path = join(result.filepath, "..", result.config.schema);
    } else {
      path = glob
        .globSync("**/schema.gql", { absolute: true, cwd: searchFrom, ignore: ["**/node_modules/**"] })
        .sort()[0];
    }

    if (result?.config?.dts) {
      dts = result.config.dts;
    }

    if (result?.filepath) {
      dts = resolve(dirname(result.filepath), dts);
    } else {
      dts = resolve(searchFrom, dts);
    }

    const model = readFileSync(path, "utf-8");
    buildResult = build(model);
  } catch {}

  return { path, dts, schema: defaultSchema, ...buildResult };
};
