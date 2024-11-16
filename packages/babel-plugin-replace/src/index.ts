import { types as t, template } from "@babel/core";
import { declare } from "@babel/helper-plugin-utils";

export type Options = {
  [key: string]: any;
};

type ReplaceOptions = {
  identifier: string;
  searchNode: babel.types.Expression;
  replaceNode: babel.types.Expression;
}[];

export default declare<ReplaceOptions>((_api, options) => {
  const replaceOptions: ReplaceOptions = Object.entries(options)
    .sort((a, b) => b[0].length - a[0].length)
    .map(([searchValue, replaceValue]) => ({
      identifier: searchValue.match(/^(typeof\s+)?([A-Za-z_$][\w$]*)/)?.[2] || "",
      searchNode: template.expression.ast(searchValue),
      replaceNode: template.expression.ast(`${replaceValue}`),
    }));

  return {
    name: "babel-plugin-replace",
    visitor: {
      Expression(path) {
        const { node, scope } = path;

        const replaceOption = replaceOptions.find(({ identifier, searchNode }) => {
          return t.isNodesEquivalent(node, searchNode) && !scope.hasBinding(identifier);
        });

        if (!replaceOption) {
          return;
        }

        path.replaceWith(t.cloneNode(replaceOption.replaceNode));
      },
    },
  };
});
