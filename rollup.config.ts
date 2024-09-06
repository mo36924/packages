import { readdirSync, readFileSync } from "node:fs";
import { basename, join, relative } from "node:path";
import { cwd } from "node:process";
import { nodeResolve } from "@rollup/plugin-node-resolve";
import swc from "@rollup/plugin-swc";
import { defineConfig } from "rollup";
import dts from "rollup-plugin-dts";

const workspaceDir = "packages";
const external = /^[@\w]/;
const resolve = nodeResolve({ extensions: [".tsx", ".ts"] });

const input = Object.fromEntries(
  readdirSync(workspaceDir)
    .filter((name) => name[0] !== ".")
    .map((name) => `${workspaceDir}/${name}`)
    .flatMap((packageDir) =>
      Object.values<{ [type: string]: string }>(JSON.parse(readFileSync(`${packageDir}/package.json`, "utf-8")).exports)
        .flatMap((_export) => Object.values(_export))
        .map((path) => basename(path).replace(/\.(js|cjs|d\.ts)$/, ""))
        .map((name): [string, string] => [`${packageDir}/dist/${name}`, `${packageDir}/src/${name}`]),
    ),
);

export default defineConfig([
  {
    input,
    output: [
      { dir: ".", format: "module" },
      { dir: ".", format: "cjs", entryFileNames: "[name].[format]" },
    ],
    external,
    plugins: [swc(), resolve],
  },
  {
    input,
    output: {
      dir: ".",
      format: "module",
      chunkFileNames: ({ moduleIds }) => `${relative(cwd(), join(moduleIds[0], "..", "..", "dist"))}/[name].d.ts`,
    },
    external,
    plugins: [dts(), resolve],
  },
]);
