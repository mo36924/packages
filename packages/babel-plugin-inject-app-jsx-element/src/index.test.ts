import { transformAsync } from "@babel/core";
import { expect, it } from "vitest";
import injectAppJsxElements from "./index";

it("babel-plugin-inject-app-jsx-element", async () => {
  const code = `
    <html>
      <head>
        <meta charset="utf-8" />
        <title>Hello</title>
      </head>
      <body>
        <h1>Hello</h1>
      </body>
    </html>
  `;

  const result = await transformAsync(code, { parserOpts: { plugins: ["jsx"] }, plugins: [injectAppJsxElements] });

  expect(result).toMatchInlineSnapshot(`
    <html>
          <head>
            <meta charset="utf-8" />
            <title>Hello</title>
          </head>
          <body><div id="app">
            <h1>Hello</h1>
          </div></body>
        </html>;
  `);
});
