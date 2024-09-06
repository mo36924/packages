import { transformSync } from "@babel/core";
import { expect, it } from "vitest";
import plugin, { Options } from "./index";

it("babel-plugin-replace-jsx-elements", () => {
  const code = `
    <>
      <A href="/">top</A>
      <a href="/user">user</a>
      <title>title</title>
      <header>header</header>
    </>
  `;

  const result = transformSync(code, {
    plugins: [[plugin, { A: "a", title: "Title", header: "Fragment" } satisfies Options]],
  });

  expect(result).toMatchInlineSnapshot(`
    <>
      <a href="/">top</a>
      <a href="/user">user</a>
      <Title>title</Title>
      <>header</>
    </>;
  `);
});
