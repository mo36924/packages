import { types as t } from "@babel/core";
import { declare } from "@babel/helper-plugin-utils";
import jsx from "@babel/plugin-syntax-jsx";

export type Options = {
  replaceTags: Record<string, string | null | undefined>;
};

export default declare<Options>((_, { replaceTags }) => {
  return {
    name: "babel-plugin-replace-jsx-elements",
    inherits: jsx.default || jsx,
    visitor: {
      JSXElement(path) {
        const {
          openingElement: { name, attributes, selfClosing: selfClosingOpeningElement },
          closingElement,
          children,
          selfClosing,
        } = path.node;

        if (!t.isJSXIdentifier(name)) {
          return;
        }

        const tag = name.name;
        const replacedTag = replaceTags[tag];

        if (!Object.hasOwn(replaceTags, tag) || !replacedTag || path.scope.hasBinding(replacedTag)) {
          return;
        }

        path.replaceWith(
          replacedTag === "Fragment"
            ? t.jsxFragment(t.jsxOpeningFragment(), t.jsxClosingFragment(), children)
            : t.jsxElement(
                t.jsxOpeningElement(t.jsxIdentifier(replacedTag), attributes, selfClosingOpeningElement),
                closingElement && t.jsxClosingElement(t.jsxIdentifier(replacedTag)),
                children,
                selfClosing,
              ),
        );
      },
    },
  };
});
