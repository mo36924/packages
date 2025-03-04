import { types as t } from "@babel/core";
import { declare } from "@babel/helper-plugin-utils";
import jsx from "@babel/plugin-syntax-jsx";

export default declare(() => {
  return {
    name: "babel-plugin-inject-app-jsx-element",
    inherits: jsx.default || jsx,
    visitor: {
      JSXElement(path) {
        const name = path.node.openingElement.name;

        if (!t.isJSXIdentifier(name) || name.name !== "body") {
          return;
        }

        const child = path.node.children[0];

        const div = t.jsxOpeningElement(t.jsxIdentifier("div"), [
          t.jsxAttribute(t.jsxIdentifier("id"), t.stringLiteral("app")),
        ]);

        if (child && child.type === "JSXElement" && t.isNodesEquivalent(child.openingElement, div)) {
          return;
        }

        path.replaceWith({
          ...path.node,
          children: [t.jsxElement(div, t.jsxClosingElement(t.jsxIdentifier("div")), path.node.children)],
        });
      },
    },
  };
});
