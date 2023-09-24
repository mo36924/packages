import { generateDtsBundle } from "dts-bundle-generator";
import { mkdir, readdir, writeFile } from "fs/promises";
import { defineConfig } from "vitest/config";

export default defineConfig(async ({ command }) => {
  const dir = "packages";
  const packages = await readdir(dir);
  if (command === "build") {
    const codes = generateDtsBundle(
      packages.map((name) => ({ filePath: `${dir}/${name}/src/index.ts`, output: { noBanner: true } })),
      { preferredConfigPath: "tsconfig.json" },
    );
    await Promise.all(
      packages.map(async (name, i) => {
        await mkdir(`${dir}/${name}/dist`, { recursive: true });
        await writeFile(`${dir}/${name}/dist/index.d.ts`, codes[i]);
      }),
    );
  }
  return {
    build: {
      outDir: ".",
      emptyOutDir: false,
      sourcemap: true,
      lib: {
        entry: Object.fromEntries(packages.map((name) => [`${dir}/${name}/dist/index`, `${dir}/${name}/src`])),
        formats: ["es", "cjs"],
      },
      rollupOptions: {
        external: /^[@\w]/,
      },
    },
    test: {
      setupFiles: "scripts/setup.ts",
    },
  };
});
