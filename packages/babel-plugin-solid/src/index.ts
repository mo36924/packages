import { readFileSync } from "node:fs";
import { relative } from "node:path";
import babel, { PluginObj } from "@babel/core";
import jsx from "@babel/plugin-syntax-jsx";
import { pascalCase } from "change-case";
import { Manifest } from "vite";

const isJSX = (path?: string): path is string => !!path && /\.[cm]?[jt]sx$/.test(path);

export type Options = {
  baseDir?: string;
  manifest?: string | Manifest;
};
export default ({ types: t }: typeof babel, options: Options): PluginObj => {
  const { baseDir = "" } = options;

  const manifest: Manifest =
    typeof options.manifest === "string"
      ? JSON.parse(readFileSync(options.manifest, "utf-8"))
      : (options.manifest ?? {});

  return {
    name: "@mo36924/babel-plugin-solid",
    inherits: jsx.default ?? jsx,
    visitor: {
      Program(path, state) {
        const filename = state.filename;

        if (!isJSX(filename)) {
          return;
        }

        let hasHydrationScript = false;

        path.traverse({
          JSXElement(path) {
            const openingElement = path.get("openingElement");
            const name = openingElement.get("name");

            if (!name.isJSXIdentifier({ name: "head" })) {
              return;
            }

            const relativePath = relative(state.cwd, filename);
            const manifestChunk = manifest[relativePath];

            if (!manifestChunk) {
              return;
            }

            const { file, imports = [], css = [] } = manifestChunk;

            path.pushContainer("children", [
              ...[file, ...imports.map((path) => manifest[path].file)].map((file) =>
                t.jsxElement(
                  t.jsxOpeningElement(
                    t.jsxIdentifier("script"),
                    [
                      t.jsxAttribute(t.jsxIdentifier("type"), t.stringLiteral("module")),
                      t.jsxAttribute(t.jsxIdentifier("src"), t.stringLiteral(`/${file}`)),
                    ],
                    true,
                  ),
                  null,
                  [],
                ),
              ),
              ...css.map((file) =>
                t.jsxElement(
                  t.jsxOpeningElement(
                    t.jsxIdentifier("link"),
                    [
                      t.jsxAttribute(t.jsxIdentifier("rel"), t.stringLiteral("stylesheet")),
                      t.jsxAttribute(t.jsxIdentifier("href"), t.stringLiteral(`/${file}`)),
                    ],
                    true,
                  ),
                  null,
                  [],
                ),
              ),
              t.jsxElement(t.jsxOpeningElement(t.jsxIdentifier("HydrationScript"), [], true), null, []),
            ]);

            hasHydrationScript = true;
          },
        });

        if (!hasHydrationScript || path.scope.hasGlobal("HydrationScript")) {
          return;
        }

        path.unshiftContainer(
          "body",
          t.importDeclaration(
            [t.importSpecifier(t.identifier("HydrationScript"), t.identifier("HydrationScript"))],
            t.stringLiteral("solid-js/web"),
          ),
        );
      },
      ExportDefaultDeclaration(path, state) {
        const filename = state.filename;

        if (!isJSX(filename)) {
          return;
        }

        const declaration = path.node.declaration;

        if (!t.isArrowFunctionExpression(declaration)) {
          return;
        }

        let name = pascalCase(relative(baseDir, filename.replace(/\.\w+$/, "") ?? ""));
        name = t.isValidIdentifier(name) ? name : "Anonymous";
        const scope = path.scope;

        while (scope.hasBinding(name)) {
          name += "_";
        }

        const [nodePath] = path.replaceWithMultiple([
          t.variableDeclaration("const", [t.variableDeclarator(t.identifier(name), declaration)]),
          t.exportDefaultDeclaration(t.identifier(name)),
        ]);

        scope.registerDeclaration(nodePath);
      },
    },
  };
};
