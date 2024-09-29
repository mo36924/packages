import tsconfigPaths from "vite-tsconfig-paths";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    snapshotSerializers: [
      "./packages/vitest-snapshot-serializer-babel/src/index.ts",
      "./packages/vitest-snapshot-serializer-raw/src/index.ts",
    ],
  },
});
