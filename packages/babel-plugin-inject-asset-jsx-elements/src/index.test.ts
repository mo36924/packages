import { transformSync } from "@babel/core";
import { Manifest } from "vite";
import { expect, it } from "vitest";
import plugin, { Options } from "./index";

it("babel-plugin-inject-asset-jsx-elements", () => {
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

  const manifest: Manifest = {
    "src/styles/index.css": { file: "assets/index.css", isEntry: true },
    "src/client/index.tsx": { file: "assets/index.js", isEntry: true },
  };

  const result = transformSync(code, { plugins: [[plugin, { manifest } satisfies Options]] });

  expect(result).toMatchInlineSnapshot(`
    <html>
      <head>
        <meta charset="utf-8" />
        <title>Hello</title>
        <link rel="stylesheet" href="/assets/index.css" />
        <script type="module" src="/assets/index.js" />
      </head>
      <body>
        <h1>Hello</h1>
      </body>
    </html>;
  `);
});
