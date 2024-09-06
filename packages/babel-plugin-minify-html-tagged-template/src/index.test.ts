import { transformSync } from "@babel/core";
import { expect, it } from "vitest";
import plugin, { Options } from "./index";

it("babel-plugin-minify-html-tagged-template", () => {
  const code = `
    html\`
      <html>
        <head>
          <meta charset="utf-8" />
          <title>Hello</title>
        </head>
        <body>
          <h1>
            \${"Hello"}
          </h1>
        </body>
      </html>
    \`
  `;

  const result = transformSync(code, {
    plugins: [[plugin, { keepHtmlAndHeadOpeningTags: true } satisfies Options]],
  });

  expect(result?.code).toMatchInlineSnapshot(
    `"html\`<html><head><meta charset=utf-8><title>Hello</title><body><h1>\${"Hello"}</h1>\`;"`,
  );
});
