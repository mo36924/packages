import { precompileJsx, Options as PrecompileJsxOptions } from "@mo36924/precompile-jsx";
import { Plugin } from "vite";

export type Options = Pick<PrecompileJsxOptions, "jsxImportSource">;

export default (options: Options = {}): Plugin => {
  return {
    name: "vite-precompile-jsx",
    enforce: "pre",
    transform(code, id, { ssr } = {}) {
      if (ssr && /\.[cm]?[tj]sx$/.test(id)) {
        return precompileJsx({ ...options, code, path: id });
      }
    },
  };
};
