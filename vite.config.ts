import { readdirSync } from "fs";
import ts from "rollup-plugin-ts";
import { defineConfig } from "vite";

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
  },
  plugins: [ts()],
});
