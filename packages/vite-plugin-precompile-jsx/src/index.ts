import { precompileJsx, Options as PrecompileJsxOptions } from "@mo36924/precompile-jsx";
import { Plugin } from "vite";

export type Options = { environment?: string } & Pick<PrecompileJsxOptions, "jsxImportSource">;

export default ({ environment = "ssr", jsxImportSource }: Options = {}): Plugin => {
  return {
    name: "vite-plugin-precompile-jsx",
    enforce: "pre",
    apply: "build",
    applyToEnvironment({ name }) {
      return name === environment;
    },
    transform(code, id, { ssr } = {}) {
      if ((ssr || this.environment.name === environment) && /\.[cm]?[tj]sx$/.test(id)) {
        return precompileJsx({ jsxImportSource, code, path: id });
      }
    },
  };
};
