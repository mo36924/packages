import { dirname, isAbsolute, relative } from "node:path";
import { types as t } from "@babel/core";
import { declare } from "@babel/helper-plugin-utils";

export type Options = {
  [identifier: string]: [source: string, name: string];
};

export default declare<Options>((_, options) => {
  return {
    name: "babel-plugin-inject",
    visitor: {
      Identifier(path, { filename = "" }) {
        const identifier = path.node.name;

        if (!Object.hasOwn(options, identifier) || path.scope.hasBinding(identifier)) {
          return;
        }

        const program = path.getAncestry().find((path) => path.isProgram());

        if (!program) {
          throw path.buildCodeFrameError(`Cannot find program node`);
        }

        const [source, name] = options[identifier];
        let normalizedSource = source;

        if (normalizedSource[0] === "." || isAbsolute(normalizedSource)) {
          normalizedSource = relative(dirname(filename), normalizedSource);
          normalizedSource = normalizedSource[0] === "." ? normalizedSource : `./${normalizedSource}`;
        }

        const [importDeclaration] = program.unshiftContainer(
          "body",
          t.importDeclaration(
            [t.importSpecifier(t.identifier(identifier), t.identifier(name))],
            t.stringLiteral(normalizedSource),
          ),
        );

        program.scope.registerDeclaration(importDeclaration);
      },
    },
  };
});
