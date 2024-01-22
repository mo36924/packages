import { transformSync } from "@babel/core";
import { expect, it } from "vitest";
import plugin, { Options } from "./index";

it("babel-plugin-solid", () => {
  const result = transformSync("export default () => <head><title>test</title></head>;", {
    filename: "index.jsx",
    plugins: [[plugin, { manifest: { "/": { file: "index.js", isEntry: true } } } as Options]],
  });

  expect(result).toMatchInlineSnapshot(`
    import { HydrationScript } from "solid-js/web";
    const Index = () => (
      <head>
        <title>test</title>
        <script type="module" src="/index.js" />
        <HydrationScript />
      </head>
    );
    export default Index;
  `);
});
