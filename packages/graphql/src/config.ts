import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { cwd } from "node:process";
import { cosmiconfigSync, getDefaultSearchPlaces } from "cosmiconfig";
import { require } from "tsx/cjs/api";
import { build } from "./schema";

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

export type Config = {
  schema?: string;
  dts?: string;
  drizzle?: string;
  database?: "d1" | "postgres";
};

export const getConfig = (searchFrom: string = cwd()) => {
  const result = explorerSync.search(searchFrom);
  const baseDir = result?.filepath ? dirname(result.filepath) : searchFrom;
  const { schema, dts, drizzle }: Config = { ...result?.config };
  return {
    schema: schema && resolve(baseDir, schema),
    dts: dts && resolve(baseDir, dts),
    drizzle: drizzle && resolve(baseDir, drizzle),
  };
};

export const getSchema = (searchFrom?: string) => {
  const config = getConfig(searchFrom);
  const model = config.schema && readFileSync(config.schema, "utf-8");
  const result = model && build(model);
  return { config, ...result };
};
