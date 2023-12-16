import { mkdir, readFile, readdir, writeFile } from "fs/promises";
import { dirname } from "path";
import { generateDtsBundle } from "dts-bundle-generator";
import { defineConfig } from "vitest/config";

export default defineConfig(async ({ command }) => {
  const dir = "packages";
  const packages = await readdir(dir);

  const entriesArray = await Promise.all(
    packages.map(async (name) => {
      const baseDir = `${dir}/${name}`;
      const data = await readFile(`${baseDir}/package.json`, "utf-8");
      const { exports } = JSON.parse(data);

      const entries: [output: string, input: string][] = Object.keys(exports)
        .map((key) => key.slice(2) || "index")
        .map((name) => [`${baseDir}/dist/${name}`, `${baseDir}/src/${name}.ts`]);

      return entries;
    }),
  );

  const entries = entriesArray.flat();

  if (command === "build") {
    const codes = generateDtsBundle(
      entries.map(([, input]) => ({ filePath: input, output: { noBanner: true } })),
      { preferredConfigPath: "tsconfig.json" },
    );

    await Promise.all(
      entries.map(async ([output], i) => {
        await mkdir(dirname(output), { recursive: true });
        await writeFile(`${output}.d.ts`, codes[i]);
      }),
    );
  }

  return {
    build: {
      outDir: ".",
      emptyOutDir: false,
      sourcemap: true,
      lib: {
        entry: Object.fromEntries(entries),
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
