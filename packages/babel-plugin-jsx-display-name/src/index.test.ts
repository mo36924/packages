import { transformAsync } from "@babel/core";
import { describe, expect, it } from "vitest";
import plugin, { Options } from "./index";

const transform = (code: string) =>
  transformAsync(code, {
    filename: "src/components/A.jsx",
    plugins: [[plugin, { componentsDir: "src/components" } satisfies Options]],
  });

describe("babel-plugin-jsx-display-name", () => {
  it("arrow function", async () => {
    const result = await transform("export default () => null");

    expect(result).toMatchInlineSnapshot(`
      var A = () => null;
      export default A;
    `);
  });

  it("class declaration", async () => {
    const result = await transform("export default class extends Component { render(){ return null }}");

    expect(result).toMatchInlineSnapshot(`
      export default class A extends Component {
        render() {
          return null;
        }
      }
    `);
  });

  it("function declaration", async () => {
    const result = await transform("export default function() { return null }");

    expect(result).toMatchInlineSnapshot(`
      export default function A() {
        return null;
      }
    `);
  });

  it("keep declaration id", async () => {
    const result = await transform("export default function Component() { return null }");

    expect(result).toMatchInlineSnapshot(`
      export default function Component() {
        return null;
      }
    `);
  });
});
