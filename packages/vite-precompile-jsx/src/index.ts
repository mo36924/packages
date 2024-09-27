import { precompileJsx, Options as PrecompileJsxOptions } from "@mo36924/precompile-jsx";
import { Plugin } from "vite";

export type Options = Pick<PrecompileJsxOptions, "jsxImportSource">;

export default (options: Options = {}): Plugin => {
  return {
    name: "vite-precompile-jsx",
    enforce: "pre",
    apply: (config) => !!config.build?.ssr,
    transform(code, id) {
      if (/\.[cm]?[tj]sx$/.test(id)) {
        return precompileJsx({ ...options, code, path: id });
      }
    },
  };
};
