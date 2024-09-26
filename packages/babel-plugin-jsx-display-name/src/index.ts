import { relative } from "node:path";
import babel, { PluginObj } from "@babel/core";
import { pascalCase } from "@mo36924/change-case";

export type Options = {
  rootDir?: string;
};

export default ({ types: t }: typeof babel, { rootDir = "src/components" }: Options): PluginObj => {
  return {
    name: "babel-plugin-jsx-display-name",
    visitor: {
      ExportDefaultDeclaration(path, { filename = "" }) {
        if (!/\.[cm]?[tj]sx$/.test(filename)) {
          return;
        }

        const {
          scope,
          node: { declaration },
        } = path;

        if (t.isArrowFunctionExpression(declaration)) {
          let { body } = declaration;
          const { params, generator, async } = declaration;

          if (t.isExpression(body)) {
            body = t.blockStatement([t.returnStatement(body)]);
          }

          path.replaceWith(t.exportDefaultDeclaration(t.functionDeclaration(null, params, body, generator, async)));
          return;
        }

        if ((t.isFunctionDeclaration(declaration) || t.isClassDeclaration(declaration)) && !declaration.id) {
          let displayName = pascalCase(relative(rootDir, filename.replace(/\.\w+$/, "")));

          if (!t.isValidIdentifier(displayName)) {
            displayName = `Component${displayName}`;

            if (!t.isValidIdentifier(displayName)) {
              displayName = "Component";
            }
          }

          while (scope.hasBinding(displayName)) {
            displayName += "$";
          }

          const identifier = t.identifier(displayName);
          declaration.id = identifier;

          path.insertAfter(
            t.expressionStatement(
              t.assignmentExpression(
                "??=",
                t.memberExpression(t.identifier(displayName), t.identifier("displayName")),
                t.stringLiteral(displayName),
              ),
            ),
          );

          scope.registerDeclaration(path);
        }
      },
    },
  };
};
