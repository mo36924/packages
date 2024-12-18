import { transformAsync, TransformOptions } from "@babel/core";
import { createFilter, FilterPattern, Plugin } from "vite";

export type BabelOptions = TransformOptions | null | undefined | void;

export type Options = {
  enforce?: "pre" | "post";
  include?: FilterPattern;
  exclude?: FilterPattern;
  options: BabelOptions | ((options: { id: string; isBuild: boolean; ssr: boolean }) => BabelOptions);
};

export default ({ enforce, include, exclude, options }: Options): Plugin => {
  const filter = createFilter(include, exclude);
  let isBuild = false;
  return {
    name: "vite-plugin-babel",
    enforce,
    configResolved({ command }) {
      isBuild = command === "build";
    },
    async transform(code, id, { ssr = false } = {}) {
      if (!filter(id)) {
        return;
      }

      const babelOptions = typeof options === "function" ? options({ id, isBuild, ssr }) : options;

      if (!babelOptions) {
        return;
      }

      const result = await transformAsync(code, {
        babelrc: false,
        configFile: false,
        browserslistConfigFile: false,
        sourceMaps: true,
        filename: id,
        parserOpts: {
          plugins: /\.[cm]?tsx$/.test(id)
            ? ["jsx", "typescript"]
            : /\.[cm]?jsx$/.test(id)
              ? ["jsx"]
              : /\.d\.[cm]?ts$/.test(id)
                ? [["typescript", { dts: true }]]
                : /\.[cm]?ts$/.test(id)
                  ? ["typescript"]
                  : /\.[cm]?js$/.test(id)
                    ? []
                    : ["jsx", "typescript"],
        },
        ...babelOptions,
      });

      if (!result) {
        return result;
      }

      return {
        code: result.code ?? undefined,
        map: result.map,
      };
    },
  };
};
