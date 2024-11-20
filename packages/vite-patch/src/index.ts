import { readdir, readFile, writeFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { join } from "node:path";

export const patch = async () => {
  const dir = join(createRequire(import.meta.url).resolve("vite/package.json"), "..", "dist", "node", "chunks");
  const names = await readdir(dir);

  await Promise.all(
    names.map(async (name) => {
      const path = join(dir, name);
      const code = await readFile(path, "utf-8");

      const replacedCode = code.replace(
        /(plugins[\s\S]+?)externalize-deps[\s\S]+?(inject-file-scope-variables)/,
        'packages: "external",$1$2',
      );

      if (code !== replacedCode) {
        await writeFile(path, replacedCode);
      }
    }),
  );
};
