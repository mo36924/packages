import devServer from "@hono/vite-dev-server";
import cloudflareAdapter from "@hono/vite-dev-server/cloudflare";
import preset, { Options as PresetOptions } from "@mo36924/babel-preset-jsx";
import babel from "@mo36924/vite-plugin-babel";
import precompileJsx from "@mo36924/vite-plugin-precompile-jsx";
import reactRouter from "@mo36924/vite-plugin-react-router";
import { ssr } from "@mo36924/vite-plugin-ssr";
import preact from "@preact/preset-vite";
import { Plugin } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";

type Options = {
  input: string;
  assets: string[];
  importPrefix?: string;
};

export default ({ input, assets, importPrefix }: Options): Plugin[] => [
  ssr({ input, assets }),
  reactRouter({ importPrefix }),
  babel({
    enforce: "pre",
    include: [/\.tsx?$/, /\/@mo36924\//],
    options: ({ isBuild, ssr }) => ({
      presets: [[preset, { development: !isBuild, server: ssr } satisfies PresetOptions]],
    }),
  }),
  precompileJsx(),
  tsconfigPaths(),
  ...preact(),
  devServer({ entry: input, adapter: cloudflareAdapter }),
];
