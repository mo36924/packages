import { TransformOptions, transformSync } from "@babel/core";
import { Plugin } from "vite";

export type BabelOptions = {
  enforce?: "pre" | "post";
  transformOptions: TransformOptions | ((options: { id: string; isBuild: boolean; ssr: boolean }) => TransformOptions);
};

export const babel = ({ enforce, transformOptions }: BabelOptions): Plugin => {
  let isBuild = false;
  return {
    name: "vite-plugin-babel",
    enforce,
    configResolved({ command }) {
      isBuild = command === "build";
    },
    transform(code, id, { ssr = false } = {}) {
      const _transformOptions =
        typeof transformOptions === "function" ? transformOptions({ id, isBuild, ssr }) : transformOptions;

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
