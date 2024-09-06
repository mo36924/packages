import { types as t } from "@babel/core";
import { declare } from "@babel/helper-plugin-utils";
import jsx from "@babel/plugin-syntax-jsx";
import { Manifest } from "vite";

export type Options = Manifest;

const replaceElementAttributes: { [tag: string]: string } = {
  link: "href",
  script: "src",
};

export default declare((_, manifest: Options) => {
  return {
    name: "babel-plugin-replace-asset-jsx-elements",
    inherits: jsx.default || jsx,
    visitor: {
      JSXElement(path) {
        const openingElement = path.get("openingElement");
        const name = openingElement.node.name;

        if (!t.isJSXIdentifier(name)) {
          return;
        }

        const tag = name.name;
        const attributeName = replaceElementAttributes[tag];

        if (!attributeName) {
          return;
        }

        const attributes = openingElement.get("attributes");

        const value = attributes
          .filter((attr) => attr.isJSXAttribute())
          .find((attr) => attr.get("name").isJSXIdentifier({ name: attributeName }))
          ?.get("value");

        const file = value?.isStringLiteral() && value.node.value.slice(1);

        if (!file) {
          return;
        }

        const chunk = manifest[file];

        if (!chunk) {
          return;
        }

        if (file && file in manifest) {
          value.replaceWith(t.stringLiteral(`/${manifest[file].file}`));
        }
      },
    },
  };
});
