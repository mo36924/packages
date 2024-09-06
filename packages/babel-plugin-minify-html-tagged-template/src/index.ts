import { Buffer } from "node:buffer";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { types as t } from "@babel/core";
import { declare } from "@babel/helper-plugin-utils";
import { snakeCase } from "change-case";
import { Config, initSync, minify } from "minify-html-wasm";

type CamelCase<S extends string> = S extends `${infer P1}_${infer P2}${infer P3}`
  ? `${Lowercase<P1>}${Uppercase<P2>}${CamelCase<P3>}`
  : Lowercase<S>;

export type Options = {
  [K in keyof Config as CamelCase<string & K>]: Config[K];
};

const require = createRequire(import.meta.url);

initSync(readFileSync(require.resolve("minify-html-wasm/web/wasm")));

export default declare<Options>((_, options) => {
  const config = Object.fromEntries(Object.entries(options).map(([key, value]) => [snakeCase(key), value]));
  return {
    name: "babel-plugin-minify-html-tagged-template",
    visitor: {
      TaggedTemplateExpression(path, state) {
        if (!path.get("tag").isIdentifier({ name: "html" })) {
          return;
        }

        const { quasis, expressions } = path.node.quasi;
        const code: string = state.file.code;
        let wrapper = "";

        while (code.includes(wrapper)) {
          wrapper += "_";
        }

        const html = quasis
          .map((quasi) => quasi.value.cooked!)
          .reduce((previous, current, i) => `${previous}${wrapper}${i - 1}${wrapper}${current}`);

        const minifiedHtml = Buffer.from(minify(Buffer.from(html), config)).toString();
        const parts = minifiedHtml.split(new RegExp(`${wrapper}(\\d+)${wrapper}`));
        const minifiedQuasis = parts.filter((_, i) => !(i % 2));
        const sortedExpressions = parts.filter((_, i) => i % 2).map((i) => expressions[Number.parseInt(i)]);

        if (quasis.length !== minifiedQuasis.length || expressions.length !== sortedExpressions.length) {
          throw path.buildCodeFrameError("Invalid html template strings array.");
        }

        path.get("quasi").replaceWith(
          t.templateLiteral(
            minifiedQuasis.map((quasi, i, self) =>
              t.templateElement({ raw: quasi, cooked: quasi }, i === self.length - 1),
            ),
            sortedExpressions,
          ),
        );
      },
    },
  };
});
