import { transformSync } from "@babel/core";
import { expect, it } from "vitest";
import plugin, { Options } from "./index";

it("babel-plugin-replace-jsx-elements", () => {
  const code = `
    const Component = () => (
      <>
        <A href="/">top</A>
        <a href="/user">user</a>
        <title>title</title>
        <header>header</header>
      </>
    );

    const Body = ({ children, ...props }) => (
      <body {...props}>
        <div id="app">{children}</div>
      </body>
    );
  `;

  const result = transformSync(code, {
    plugins: [
      [plugin, { replaceTags: { A: "a", title: "Title", header: "Fragment", body: "Body" } } satisfies Options],
    ],
  });

  expect(result).toMatchInlineSnapshot(`
    const Component = () => <>
            <a href="/">top</a>
            <a href="/user">user</a>
            <Title>title</Title>
            <>header</>
          </>;
    const Body = ({
      children,
      ...props
    }) => <body {...props}>
            <div id="app">{children}</div>
          </body>;
  `);
});
