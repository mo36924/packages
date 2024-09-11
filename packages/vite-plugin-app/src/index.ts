import devServer from "@hono/vite-dev-server";
import { precompile as jsxPrecompile } from "@mo36924/jsx-precompile/vite";
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

export default ({
  server = "src/server/index.tsx",
  client = "src/client/index.tsx",
  assets = ["src/styles/index.css"],
  precompile,
}: Options = {}): Plugin[] => [
  tsconfigPaths(),
  config({ server, client, assets }),
  routeGenerator(),
  babel(),
  ...(precompile ? [jsxPrecompile()] : []),
  ssrBuild(),
  devServer({ entry: server }),
];
