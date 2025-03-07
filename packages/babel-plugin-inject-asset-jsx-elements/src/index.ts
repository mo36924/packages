import { relative } from "node:path";
import { types as t } from "@babel/core";
import { declare } from "@babel/helper-plugin-utils";
import jsx from "@babel/plugin-syntax-jsx";
import { Manifest } from "vite";

export type Options = {
  manifest?: Manifest;
};

const compareBooleans = (a: boolean = false, b: boolean = false) => (a === b ? 0 : a ? -1 : 1);

const isCss = (path: string) => path.endsWith(".css");

const jsxElement = (tag: string, attrs: Record<string, string> = {}) =>
  t.jsxElement(
    t.jsxOpeningElement(
      t.jsxIdentifier(tag),
      Object.entries(attrs).map(([key, value]) => t.jsxAttribute(t.jsxIdentifier(key), t.stringLiteral(value))),
      true,
    ),
    null,
    [],
  );

export default declare<Options>((_, { manifest = {} }) => {
  return {
    name: "babel-plugin-inject-asset-jsx-elements",
    inherits: jsx.default || jsx,
    visitor: {
      JSXElement(path, { filename = "" }) {
        const name = path.node.openingElement.name;

        if (!t.isJSXIdentifier(name) || name.name !== "head") {
          return;
        }

        const file = relative(".", filename);

        path.pushContainer(
          "children",
          Object.values(manifest)
            .filter(({ isEntry, src }) => isEntry || src === file)
            .flatMap((chunk) => [chunk, ...(chunk.imports ?? []).map((src) => manifest[src])])
            .filter((chunk, i, self) => self.indexOf(chunk) === i)
            .sort(
              (a, b) =>
                compareBooleans(isCss(a.file), isCss(b.file)) ||
                compareBooleans(a.isEntry, b.isEntry) ||
                compareBooleans(a.isDynamicEntry, b.isDynamicEntry),
            )
            .map(({ file, isEntry }) =>
              isCss(file)
                ? jsxElement("link", { rel: "stylesheet", href: `/${file}` })
                : isEntry
                  ? jsxElement("script", { type: "module", src: `/${file}` })
                  : jsxElement("link", { rel: "modulepreload", href: `/${file}` }),
            ),
        );
      },
    },
  };
});
