import { relative } from "node:path";
import { types as t } from "@babel/core";
import { declare } from "@babel/helper-plugin-utils";
import { pascalCase } from "@mo36924/change-case";

export type Options = {
  componentsDir?: string;
};

export default declare<Options>((_api, { componentsDir = "src/components" }) => {
  return {
    name: "babel-plugin-jsx-display-name",
    visitor: {
      ExportDefaultDeclaration(path, { filename = "" }) {
        const { scope } = path;
        const declaration = path.get("declaration");

        if (
          !(
            declaration.isArrowFunctionExpression() ||
            (declaration.isClassDeclaration() && !declaration.get("id").node) ||
            (declaration.isFunctionDeclaration() && !declaration.get("id").node)
          )
        ) {
          return;
        }

        let displayName = pascalCase(relative(componentsDir, filename.replace(/\.\w+$/, "")));

        if (!t.isValidIdentifier(displayName)) {
          displayName = `Component${displayName}`;

          if (!t.isValidIdentifier(displayName)) {
            displayName = "Component";
          }
        }

        while (scope.hasBinding(displayName)) {
          displayName += "$";
        }

        if (declaration.isArrowFunctionExpression()) {
          path.replaceWithMultiple([
            t.variableDeclaration("var", [t.variableDeclarator(t.identifier(displayName), declaration.node)]),
            t.exportDefaultDeclaration(t.identifier(displayName)),
          ]);
        } else if (declaration.isClassDeclaration()) {
          declaration.get("id").replaceWith(t.identifier(displayName));
        } else if (declaration.isFunctionDeclaration()) {
          declaration.get("id").replaceWith(t.identifier(displayName));
        }
      },
    },
  };
});
