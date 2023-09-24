import { BabelFileResult } from "@babel/core";
import { format, resolveConfig } from "@prettier/sync";
import { expect } from "vitest";

const config = { ...resolveConfig("index.js"), filepath: "index.js" };

expect.addSnapshotSerializer({
  test: (value: BabelFileResult) =>
    !!value && typeof value.code === "string" && "ast" in value && "map" in value && "metadata" in value,
  serialize: (value: BabelFileResult) => format(value.code!, config).trim(),
});
