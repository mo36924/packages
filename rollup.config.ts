import { readFileSync, readdirSync } from "node:fs";
import { nodeResolve } from "@rollup/plugin-node-resolve";
import { defineConfig } from "rollup";
import dts from "rollup-plugin-dts";
import esbuild from "rollup-plugin-esbuild";

export default defineConfig(async (_) => {
  const workspaceDir = "packages";
  const resolve = nodeResolve({ extensions: [".tsx", ".ts"] });

  const input = Object.fromEntries(
    readdirSync(workspaceDir)
      .filter((name) => name[0] !== ".")
      .map((name) => `${workspaceDir}/${name}`)
      .flatMap((packageDir) =>
        Object.keys(JSON.parse(readFileSync(`${packageDir}/package.json`, "utf-8")).exports)
          .map((key) => key.slice(2) || "index")
          .map((name) => [`${packageDir}/dist/${name}`, `${packageDir}/src/${name}`] as const),
      ),
  );

  return [
    {
      input,
      output: [
        { dir: ".", format: "module" },
        { dir: ".", format: "cjs", entryFileNames: "[name].[format]" },
      ],
      external: /^[@\w]/,
      plugins: [esbuild(), resolve],
    },
    {
      input,
      output: { dir: ".", format: "module" },
      external: /^[@\w]/,
      plugins: [dts(), resolve],
    },
  ];
});
