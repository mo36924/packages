import { relative as _relative, dirname, sep } from "node:path";

export const relative = (from: string, to: string) => {
  const relativePath = _relative(dirname(from), to).replaceAll(sep, "/");

  if (relativePath.startsWith("..")) {
    return relativePath;
  }

  return `./${relativePath}`;
};
