import { expect } from "vitest";
import { format, resolveConfig } from "prettier";
import { BabelFileResult } from "@babel/core";

const config = { ...resolveConfig.sync("index.js"), filepath: "index.js" };

expect.addSnapshotSerializer({
  test: (value: BabelFileResult) =>
    !!value && typeof value.code === "string" && "ast" in value && "map" in value && "metadata" in value,
  serialize: (value: BabelFileResult) => format(value.code!, config).trim(),
});
