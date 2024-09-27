import { readFileSync, writeFileSync } from "node:fs";
import { getSchemaPath } from "./config";
import { formatGraphQL } from "./format";
import { fixModel } from "./model";

export const fix = (searchFrom?: string) => {
  try {
    const schemaPath = getSchemaPath(searchFrom);
    const model = readFileSync(schemaPath, "utf-8");
    const fixedModel = fixModel(model);
    const formattedModel = formatGraphQL(fixedModel);
    writeFileSync(schemaPath, formattedModel);
  } catch {}
};
