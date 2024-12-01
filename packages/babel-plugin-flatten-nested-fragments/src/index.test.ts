import { transformSync } from "@babel/core";
import { expect, it } from "vitest";
import plugin from "./index";

it("babel-plugin-flatten-nested-fragments", () => {
  const code = `
    <>
      <div>a</div>
      <>b</>
      <>
        <div>c</div>
      </>
      <>
        <>d</>
      </>
    </>
  `;

  const result = transformSync(code, { plugins: [plugin] });

  expect(result).toMatchInlineSnapshot(`
    <>
          <div>a</div>
          b
          
            <div>c</div>
          
          
            d
          
        </>;
  `);
});
