import { declare } from "@babel/helper-plugin-utils";
import jsx from "@babel/plugin-syntax-jsx";

export default declare(() => {
  return {
    name: "babel-plugin-flatten-nested-fragments",
    inherits: jsx.default || jsx,
    visitor: {
      JSXFragment(path) {
        if (path.parentPath.isJSXFragment()) {
          path.replaceInline(path.node.children);
        }
      },
    },
  };
});
