import { TransformOptions as BabelTransformOptions, transformSync } from "@babel/core";
import { createFilter, FilterPattern, Plugin } from "vite";

type TransformOptions = BabelTransformOptions | null | undefined | void;

export type BabelOptions = {
  enforce?: "pre" | "post";
  include?: FilterPattern;
  exclude?: FilterPattern;
  transformOptions: TransformOptions | ((options: { id: string; isBuild: boolean; ssr: boolean }) => TransformOptions);
};

export const babel = ({ enforce, include, exclude, transformOptions }: BabelOptions): Plugin => {
  const filter = createFilter(include, exclude);
  let isBuild = false;
  return {
    name: "vite-plugin-babel",
    enforce,
    configResolved({ command }) {
      isBuild = command === "build";
    },
    transform(code, id, { ssr = false } = {}) {
      if (!filter(id)) {
        return;
      }

      const _transformOptions =
        typeof transformOptions === "function" ? transformOptions({ id, isBuild, ssr }) : transformOptions;

      if (!_transformOptions) {
        return;
      }

      return transformSync(code, {
        babelrc: false,
        configFile: false,
        browserslistConfigFile: false,
        sourceMaps: true,
        filename: id,
        parserOpts: {
          plugins: /\.[cm]?tsx?$/.test(id) ? ["typescript"] : /\.[cm]?jsx$/.test(id) ? ["jsx"] : undefined,
        },
        ..._transformOptions,
      }) as any;
    },
  };
};
