import { transformSync } from "@babel/core";
import replace, { Options as ReplaceOptions } from "@mo36924/babel-plugin-replace";
import { expect, it } from "vitest";
import dec from "./index";

it("babel-plugin-dead-code-elimination", () => {
  const code = `
    import { useState, useEffect } from "react"
    if(import.meta.env.PROD){
      console.log(useState)
    }
    if(import.meta.env.DEV){
      console.log(useEffect)
    }
  `;

  const result = transformSync(code, {
    plugins: [[replace, { "import.meta.env.PROD": true, "import.meta.env.DEV": false } satisfies ReplaceOptions], dec],
  });

  expect(result).toMatchInlineSnapshot(`
    import { useState } from "react";
    {
      console.log(useState);
    }
  `);
});
