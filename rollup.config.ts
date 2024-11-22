import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { cwd } from "node:process";
import { nodeResolve } from "@rollup/plugin-node-resolve";
import swc from "@rollup/plugin-swc";
import { defineConfig } from "rollup";
import dts from "rollup-plugin-dts";

const workspaceDir = "packages";
const external = /^[@\w]/;
const resolve = nodeResolve({ extensions: [".tsx", ".ts"] });

const resolvePath = (path: string) =>
  [".tsx", ".ts", "/index.tsx", "/index.ts"]
    .map((ext) => path + ext)
    .find((path) => statSync(path, { throwIfNoEntry: false })?.isFile()) ?? path;

const input = Object.fromEntries(
  readdirSync(workspaceDir)
    .filter((name) => name[0] !== ".")
    .map((name) => `${workspaceDir}/${name}`)
    .flatMap((packageDir) =>
      Object.values<{ [type: string]: string }>(JSON.parse(readFileSync(`${packageDir}/package.json`, "utf-8")).exports)
        .flatMap((_export) => Object.values(_export))
        .map((path) => path.replace(/^\.\/dist\//, "").replace(/\.(js|cjs|d\.ts)$/, ""))
        .filter((name, index, self) => self.indexOf(name) === index)
        .map((name): [string, string] => [`${packageDir}/dist/${name}`, resolvePath(`${packageDir}/src/${name}`)]),
    ),
);

export default defineConfig([
  {
    input,
    output: {
      dir: ".",
      format: "module",
      chunkFileNames: ({ moduleIds }) => `${relative(cwd(), join(moduleIds[0], "..", "..", "dist"))}/[name].js`,
    },
    plugins: [
      swc(),
      resolve,
      {
        name: "resolve",
        resolveId(source, importer) {
          if (source === "graphql") {
            return { id: `${source}/index.mjs`, external: true };
          }

          if (source === "graphql/execution/execute") {
            return { id: `${source}.mjs`, external: true };
          }

          if (importer && external.test(source)) {
            return { id: source, external: true };
          }
        },
      },
    ],
  },
  {
    input,
    output: {
      dir: ".",
      format: "cjs",
      entryFileNames: "[name].cjs",
      chunkFileNames: ({ moduleIds }) => `${relative(cwd(), join(moduleIds[0], "..", "..", "dist"))}/[name].cjs`,
    },
    plugins: [
      swc(),
      resolve,
      {
        name: "resolve",
        resolveId(source, importer) {
          if (source === "graphql") {
            return { id: `${source}/index.js`, external: true };
          }

          if (source === "graphql/execution/execute") {
            return { id: `${source}.js`, external: true };
          }

          if (importer && external.test(source)) {
            return { id: source, external: true };
          }
        },
      },
    ],
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
