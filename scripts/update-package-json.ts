import { readdir, readFile, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import { cwd } from "node:process";
import depcheck from "depcheck";
import { ESLint } from "eslint";
import { format, resolveConfig } from "prettier";
import { version } from "../lerna.json";
import { author, devDependencies, name } from "../package.json";

const dir = resolve("packages");
const names = await readdir(dir);
const eslint = new ESLint({ fix: true });
const prettierConfig = await resolveConfig(cwd());

const pkgs = await Promise.all(
  names
    .filter((name) => name[0] !== ".")
    .map(async (name) => {
      const packageDir = join(dir, name);
      const code = await readFile(join(packageDir, "package.json"), "utf-8");
      const pkg = JSON.parse(code);

      const result = await depcheck(packageDir, {
        ignoreDirs: ["dist"],
        ignorePatterns: ["*.test.*"],
      });

      return { name, code, pkg, result };
    }),
);

const deps = Object.assign(
  Object.create(null),
  devDependencies,
  Object.fromEntries(pkgs.map(({ pkg: { name, version } }) => [name, `^${version}`])),
);

const deleteEmptyObject = (obj: any) => (Object.keys(obj).length ? obj : undefined);

await Promise.all(
  pkgs.map(async ({ name: _name, code, pkg, result }) => {
    const path = join(dir, _name, "package.json");

    const data = JSON.stringify({
      version,
      description: _name,
      keywords: [],
      main: "./dist/index.js",
      files: ["dist"],
      ...pkg,
      license: "MIT",
      name: `@${author}/${_name}`,
      author,
      type: "module",
      homepage: `https://github.com/${author}/${name}#readme`,
      bugs: {
        url: `https://github.com/${author}/${name}/issues`,
      },
      repository: {
        type: "git",
        url: `git+https://github.com/${author}/${name}.git`,
        directory: `packages/${_name}`,
      },
      module: "./dist/index.js",
      types: "./dist/index.d.ts",
      publishConfig: {
        access: "public",
      },
      exports: Object.fromEntries(
        Object.entries<{ [key: string]: string }>(pkg.exports ?? { ".": {} }).map(([key, value]) => {
          const name = key.slice(2) || "index";
          return [
            key,
            {
              ...value,
              types: `./dist/${name}.d.ts`,
              import: `./dist/${name}.js`,
              require: `./dist/${name}.cjs`,
              default: `./dist/${name}.js`,
            },
          ];
        }),
      ),
      dependencies: deleteEmptyObject({
        ...pkg.dependencies,
        ...Object.fromEntries(
          Object.keys(result.using)
            .map((name) => `@types/${name.replace("@", "").replace("/", "__")}`)
            .map((name) => [name, deps[name]]),
        ),
        ...Object.fromEntries(Object.keys(result.using).map((name) => [name, deps[name]])),
        ...Object.fromEntries(
          Object.entries<string>(pkg.dependencies ?? {}).filter(([_, version]) => version.includes("||")),
        ),
      }),
      default: undefined,
    });

    let fixedCode = data;

    for (let i = 0; i < 3; i++) {
      const [{ output = fixedCode, fixableErrorCount }] = await eslint.lintText(fixedCode, { filePath: path });
      fixedCode = output;

      if (!fixableErrorCount) {
        break;
      }
    }

    const formattedCode = await format(fixedCode, { ...prettierConfig, filepath: path });

    if (code !== formattedCode) {
      await writeFile(path, formattedCode);
    }
  }),
);
