import { readdirSync } from "fs";
import ts from "rollup-plugin-ts";
import { defineConfig } from "vitest/config";

export default defineConfig({
  build: {
    outDir: ".",
    emptyOutDir: false,
    sourcemap: true,
    lib: {
      entry: Object.fromEntries(
        readdirSync("packages").map((dir) => [`packages/${dir}/dist/index`, `packages/${dir}/src`]),
      ),
      formats: ["es", "cjs"],
    },
    rollupOptions: {
      external: /^[@\w]/,
    },
  },
  plugins: [{ ...ts(), enforce: "pre" }],
  test: {
    setupFiles: "setup.ts",
  },
});
