import { transformSync } from "@babel/core";
import { expect, it } from "vitest";
import plugin, { Options } from "./index";

const code = `
export default () => (
  <html lang="en">
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>Document</title>
    </head>
    <body>
      Hello World!
    </body>
  </html>
)
`;

const transform = (options: Options) =>
  transformSync(code, {
    filename: "index.jsx",
    plugins: [[plugin, { ...options, manifest: { "index.jsx": { file: "index.js", isEntry: true } } } as Options]],
  });

it("babel-plugin-solid", () => {
  expect(transform({})).toMatchInlineSnapshot(`
    import { HydrationScript } from "solid-js/web";
    const Index = () => (
      <html lang="en">
        <head>
          <meta charset="UTF-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          <title>Document</title>
          <script type="module" src="/index.js" />
          <HydrationScript />
        </head>
        <body>Hello World!</body>
      </html>
    );
    export default Index;
  `);
});
