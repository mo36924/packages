import { BabelFileResult } from "@babel/core";
import { format, resolveConfig } from "v2-prettier";
import { expect } from "vitest";

const config = { ...resolveConfig.sync("index.js"), filepath: "index.js" };

expect.addSnapshotSerializer({
  test: (value: BabelFileResult) =>
    !!value && typeof value.code === "string" && "ast" in value && "map" in value && "metadata" in value,
  serialize: (value: BabelFileResult) => format(value.code!, config).trim(),
});
