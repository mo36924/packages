import babel, { PluginObj } from "@babel/core";
import { pascalCase } from "change-case";
import { relative } from "path";

export type Options = { baseDir?: string };

export default ({ types: t }: typeof babel, options: Options): PluginObj => {
  return {
    visitor: {
      ExportDefaultDeclaration(path, state) {
        const declaration = path.node.declaration;

        if (!t.isArrowFunctionExpression(declaration)) {
          return;
        }

        let name = pascalCase(relative(options.baseDir ?? ".", state.filename!.replace(/\.\w+$/, "")));
        name = /\W/.test(name) ? "Anonymous" : name;
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
