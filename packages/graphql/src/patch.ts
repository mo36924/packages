#!/usr/bin/env node
import { readFileSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";

const path = createRequire(import.meta.url).resolve("graphql/package.json");
const pkg = JSON.parse(readFileSync(path, "utf-8"));

writeFileSync(
  path,
  JSON.stringify(
    {
      ...pkg,
      exports: {
        ".": {
          types: "./index.d.ts",
          import: "./index.mjs",
          require: "./index.js",
          default: "./index.js",
        },
        "./package.json": "./package.json",
        "./*": {
          types: "./*.d.ts",
          import: "./*.mjs",
          require: "./*.js",
          default: "./*.js",
        },
      },
    },
    null,
    2,
  ),
);
