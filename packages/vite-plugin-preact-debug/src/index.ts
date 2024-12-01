import { TransformOptions } from "@babel/core";
import MagicString from "magic-string";
import { createFilter, FilterPattern, Plugin } from "vite";

export type BabelOptions = TransformOptions | null | undefined | void;

export type Options = {
  include?: FilterPattern;
};

export default ({ include }: Options = {}): Plugin => {
  let filter: ReturnType<typeof createFilter> | undefined;
  return {
    name: "vite-plugin-babel",
    enforce: "post",
    configResolved({ command, build }) {
      if (command !== "build") {
        return;
      }

      if (include) {
        filter = createFilter(include);
        return;
      }

      const input = build.rollupOptions.input;
      const inputs = typeof input === "object" ? Object.values(input) : input ? [input] : [];
      const scripts = inputs.filter((input) => !input.endsWith(".css"));

      if (scripts.length) {
        filter = createFilter(scripts);
      }
    },
    transform(code, id, { ssr } = {}) {
      if (ssr || !filter?.(id)) {
        return;
      }

      const s = new MagicString(code);
      s.prepend("import 'preact/debug'\n");
      return { code: s.toString(), map: s.generateMap({ hires: true }) };
    },
  };
};
