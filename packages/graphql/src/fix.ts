import { writeFileSync } from "node:fs";
import { getConfig } from "./config";
import { formatGraphQL } from "./format";
import { fixModel } from "./model";

export const fix = (searchFrom?: string) => {
  const { path, model } = getConfig(searchFrom);

  if (path && model) {
    try {
      const fixedModel = fixModel(model);
      const formattedModel = formatGraphQL(fixedModel);
      writeFileSync(path, formattedModel);
    } catch {}
  }
};
