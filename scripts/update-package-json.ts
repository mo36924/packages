import { readdir, writeFile } from "fs/promises";
import { join, resolve } from "path";
import depcheck from "depcheck";
import { format, resolveConfig } from "prettier";
import sort from "sort-package-json";
import { author, devDependencies, name } from "../package.json";

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
  resolveConfig("package.json"),
]);

const deps = Object.assign(
  Object.create(null),
  devDependencies,
  Object.fromEntries(pkgs.map(([, { name, version }]) => [name, `^${version}`])),
);

const deleteEmptyObject = (obj: any) => (Object.keys(obj).length ? obj : undefined);

await Promise.all(
  pkgs.map(async ([_name, _pkg, result]) => {
    const path = join(dir, _name, "package.json");
    const data = await format(
      JSON.stringify(
        sort({
          version: "0.0.1",
          description: _name,
          keywords: [],
          ..._pkg,
          license: "MIT",
          name: `@${author}/${_name}`,
          author: author,
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
          dependencies: deleteEmptyObject({
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
      { ...config, filepath: path },
    );
    await writeFile(path, data);
  }),
);
