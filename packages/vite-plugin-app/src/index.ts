import { readFileSync } from "node:fs";
import devServer from "@hono/vite-dev-server";
import { buildSchema } from "@mo36924/graphql";
import { precompile as jsxPrecompile } from "@mo36924/jsx-precompile/vite";
import babel from "@mo36924/vite-plugin-babel";
import config from "@mo36924/vite-plugin-config";
import routeGenerator from "@mo36924/vite-plugin-route-generator";
import ssrBuild from "@mo36924/vite-plugin-ssr-build";
import { GraphQLSchema } from "graphql";
import autoImport from "unplugin-auto-import/vite";
import { Plugin } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";

export type Options = {
  server?: string;
  client?: string;
  assets?: string[];
  schema?: string;
  precompile?: boolean;
};

export default ({
  server = "src/server/index.tsx",
  client = "src/client/index.tsx",
  assets = ["src/styles/index.css"],
  schema = "schema.gql",
  precompile,
}: Options = {}): Plugin[] => {
  let _schema: string | undefined;
  let graphQLSchema: GraphQLSchema | undefined;

  try {
    _schema = readFileSync(schema, "utf-8");
  } catch {}

  if (_schema) {
    graphQLSchema = buildSchema(_schema);
  }

  return [
    config({ server, client, assets }),
    routeGenerator(),
    babel({ schema: graphQLSchema }),
    ...(precompile ? [jsxPrecompile()] : []),
    ssrBuild(),
    devServer({ entry: server }),
    tsconfigPaths(),
    autoImport({
      imports: ["react", { "~/lib/routes": ["match", "Title", "Body", "A", "Router"] }],
      dirs: ["src/components"],
      dts: "src/types/imports.d.ts",
    }),
  ];
};
