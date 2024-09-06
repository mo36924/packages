import { types as t } from "@babel/core";
import { declare } from "@babel/helper-plugin-utils";
import jsx from "@babel/plugin-syntax-jsx";

export type Options = { elements: string[] };

export default declare<Options>((_, { elements }) => {
  return {
    name: "babel-plugin-remove-jsx-elements",
    inherits: jsx.default || jsx,
    visitor: {
      JSXElement(path) {
        const name = path.node.openingElement.name;

        if (!t.isJSXIdentifier(name) || !elements.includes(name.name)) {
          return;
        }

        if (t.isJSXElement(path.parent) || t.isJSXFragment(path.parent)) {
          path.remove();
        } else {
          path.replaceWith(t.jsxFragment(t.jsxOpeningFragment(), t.jsxClosingFragment(), []));
        }
      },
    },
  };
});
