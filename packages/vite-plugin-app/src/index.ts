import devServer from "@hono/vite-dev-server";
import { precompile } from "@mo36924/jsx-precompile/vite";
import babel from "@mo36924/vite-plugin-babel";
import config from "@mo36924/vite-plugin-config";
import routeGenerator from "@mo36924/vite-plugin-route-generator";
import ssrBuild from "@mo36924/vite-plugin-ssr-build";
import { Plugin } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";

export type Options = {
  server?: string;
  client?: string;
  assets?: string[];
  precompile?: boolean;
};

export default (options: Options = {}): Plugin[] => [
  tsconfigPaths(),
  config(options),
  routeGenerator(),
  babel(),
  ...(options.precompile ? [precompile()] : []),
  ssrBuild(),
  devServer({ entry: options.server }),
];
