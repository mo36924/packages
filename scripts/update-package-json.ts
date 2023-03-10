import depcheck from "depcheck";
import { readdir, writeFile } from "fs/promises";
import { join, resolve } from "path";
import prettier from "prettier";
import sort from "sort-package-json";
import pkg from "../package.json";

const dir = resolve("packages");

const [pkgs, config] = await Promise.all([
  readdir(dir).then((names) =>
    Promise.all(
      names
        .filter((name) => name[0] !== ".")
        .map((name) =>
          Promise.all([
            name,
            import(join(dir, name, "package.json")),
            depcheck(join(dir, name), {
              ignoreDirs: ["dist"],
              ignorePatterns: ["*.test.*"],
            }),
          ]),
        ),
    ),
  ),
  prettier.resolveConfig("package.json"),
]);

const deps = Object.assign(
  Object.create(null),
  pkg.devDependencies,
  Object.fromEntries(pkgs.filter(([, pkg]) => pkg.name && pkg.version).map(([, pkg]) => [pkg.name, `^${pkg.version}`])),
);

const _deps = (obj: any) => (Object.keys(obj).length ? obj : undefined);

await Promise.all(
  pkgs.map(([name, _pkg, result]) =>
    writeFile(
      join(dir, name, "package.json"),
      prettier.format(
        JSON.stringify(
          sort({
            version: "0.0.1",
            description: name,
            keywords: [],
            ..._pkg,
            license: "MIT",
            name: `@${pkg.author}/${name}`,
            author: pkg.author,
            type: "module",
            homepage: `https://github.com/${pkg.author}/${pkg.name}#readme`,
            bugs: {
              url: `https://github.com/${pkg.author}/${pkg.name}/issues`,
            },
            repository: {
              type: "git",
              url: `git+https://github.com/${pkg.author}/${pkg.name}.git`,
              directory: `packages/${name}`,
            },
            main: "./dist/index.js",
            module: "./dist/index.js",
            types: "./dist/index.d.ts",
            publishConfig: {
              access: "public",
            },
            typesVersions: { "*": { "*": ["dist/*.d.ts", "*"] } },
            files: ["dist"],
            exports: Object.fromEntries(
              Object.keys(_pkg.exports ?? { ".": {} }).map((key) => {
                const name = key.slice(2) || "index";
                return [
                  key,
                  {
                    types: `./dist/${name}.d.ts`,
                    import: `./dist/${name}.js`,
                    require: `./dist/${name}.cjs`,
                    default: `./dist/${name}.js`,
                  },
                ];
              }),
            ),
            dependencies: _deps({
              ..._pkg.dependencies,
              ...Object.fromEntries(
                Object.keys(result.using)
                  .map((name) => `@types/${name.replace("@", "").replace("/", "__")}`)
                  .map((name) => [name, deps[name]]),
              ),
              ...Object.fromEntries(Object.keys(result.using).map((name) => [name, deps[name]])),
            }),
            default: undefined,
          }),
        ),
        { ...config, filepath: "package.json" },
      ),
    ),
  ),
);
