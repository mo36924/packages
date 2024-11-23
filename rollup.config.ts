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
    output: [
      {
        dir: ".",
        format: "module",
        entryFileNames: "[name].js",
        hoistTransitiveImports: false,
        generatedCode: "es2015",
        chunkFileNames: ({ moduleIds }) => `${relative(cwd(), join(moduleIds[0], "..", "..", "dist"))}/[name].js`,
      },
      {
        dir: ".",
        format: "commonjs",
        entryFileNames: "[name].cjs",
        hoistTransitiveImports: false,
        generatedCode: "es2015",
        chunkFileNames: ({ moduleIds }) => `${relative(cwd(), join(moduleIds[0], "..", "..", "dist"))}/[name].cjs`,
      },
    ],
    external,
    plugins: [swc({ swc: { jsc: { target: "es2022" } } }), resolve],
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
