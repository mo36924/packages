import { transformSync } from "@babel/core";
import { expect, it } from "vitest";
import plugin, { Options } from "./index";

it("babel-plugin-remove-jsx-elements", () => {
  const code = `
    const A = (
      <html>
        <head>
          <meta charset="utf-8" />
          <title>Hello</title>
        </head>
        <body>
          <h1>Hello</h1>
        </body>
      </html>
    )

    const B = (
      <>
        <head>
          <meta charset="utf-8" />
          <title>Hello</title>
        </head>
        <body>
          <h1>Hello</h1>
        </body>
      </>
    )
  `;

  const result = transformSync(code, { plugins: [[plugin, { elements: ["html", "head"] } satisfies Options]] });

  expect(result).toMatchInlineSnapshot(`
    const A = <></>;
    const B = <>
            
            <body>
              <h1>Hello</h1>
            </body>
          </>;
  `);
});
