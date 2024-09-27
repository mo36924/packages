import { readFileSync, writeFileSync } from "node:fs";
import { formatGraphQL } from "./format";
import { fixModel } from "./model";

export const fix = (path: string) => {
  const model = readFileSync(path, "utf-8");
  const fixedModel = fixModel(model);
  const formattedModel = formatGraphQL(fixedModel);
  writeFileSync(path, formattedModel);
};
