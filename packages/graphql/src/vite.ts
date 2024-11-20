import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { parse } from "graphql";
import { Plugin } from "vite";
import { getSchema } from "./config";

const schemaDir = dirname(fileURLToPath(import.meta.url));
const schemaPaths = ["js", "cjs", "ts"].map((extname) => join(schemaDir, `schema.gql.${extname}`));

export type Options = {
  searchFrom?: string;
};

export default ({ searchFrom }: Options = {}): Plugin => {
  return {
    name: "vite-graphql",
    load(id) {
      if (schemaPaths.includes(id)) {
        const { source } = getSchema(searchFrom);

        if (!source) {
          return;
        }

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
