import tsconfigPaths from "vite-tsconfig-paths";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [tsconfigPaths()],
  resolve: {
    extensions: [".ts", ".js", ".mjs"],
  },
  test: {
    snapshotSerializers: [
      "./packages/vitest-snapshot-serializer-babel/src/index.ts",
      "./packages/vitest-snapshot-serializer-raw/src/index.ts",
    ],
  },
});
