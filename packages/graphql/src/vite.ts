import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { parse } from "graphql";
import { Plugin } from "vite";
import { getSchema } from "./config";
import { fix } from "./fix";
import { getSource } from "./source";

const schemaDir = dirname(fileURLToPath(import.meta.url));
const schemaPaths = ["js", "cjs", "ts"].map((extname) => join(schemaDir, `schema.gql.${extname}`));

export type Options = {
  searchFrom?: string;
};

export default (options: Options = {}): Plugin => {
  let isBuild = false;
  return {
    name: "vite-graphql",
    async configResolved(config) {
      isBuild = config.command === "build";

      if (!config.build.ssr) {
        fix(options.searchFrom);
      }
    },
    load(id) {
      if (isBuild && schemaPaths.includes(id)) {
        const schema = getSchema(options.searchFrom);
        const source = getSource(schema);
        const documentNode = parse(source, { noLocation: true });
        return `
          import { buildASTSchema } from "graphql";
          import { mergeCustomScalars } from "@mo36924/graphql/merge";
          export const schema = mergeCustomScalars(buildASTSchema(JSON.parse(${JSON.stringify(JSON.stringify(documentNode))})));
        `;
      }
    },
  };
};
