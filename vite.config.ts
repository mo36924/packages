import { readdir } from "fs/promises";
import ts from "rollup-plugin-ts";
import { defineConfig } from "vitest/config";

export default defineConfig(async () => {
  const dir = "packages";
  const packages = await readdir(dir);
  const entry = Object.fromEntries(packages.map((name) => [`${dir}/${name}/dist/index`, `${dir}/${name}/src`]));
  return {
    build: {
      outDir: ".",
      emptyOutDir: false,
      sourcemap: true,
      lib: { entry, formats: ["es", "cjs"] },
      rollupOptions: {
        external: /^[@\w]/,
      },
    },
    plugins: [{ ...ts(), enforce: "pre" }],
    test: {
      setupFiles: "setup.ts",
    },
  };
});
