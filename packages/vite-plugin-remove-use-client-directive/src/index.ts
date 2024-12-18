import { Plugin } from "vite";

export const removeUseClientDirective = (): Plugin => {
  return {
    name: "vite-plugin-remove-use-client-directive",
    transform(code) {
      if (code.startsWith("'use client'") || code.startsWith('"use client"')) {
        return { code: `            ${code.slice(12)}`, map: null };
      }
    },
  };
};
