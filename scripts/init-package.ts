import { ok } from "node:assert";
import { mkdir, writeFile } from "node:fs/promises";
import { argv } from "node:process";
import validate from "validate-npm-package-name";

const workspaceDir = "packages";
const name = argv[2];
const { validForNewPackages, validForOldPackages } = validate(name);
ok(validForNewPackages && validForOldPackages);

await mkdir(`${workspaceDir}/${name}/src`, { recursive: true });

await Promise.allSettled([
  writeFile(`${workspaceDir}/${name}/package.json`, "{}", { flag: "wx" }),
  writeFile(`${workspaceDir}/${name}/README.md`, `# ${name}\n\n${name}\n`, { flag: "wx" }),
]);

await import("./update-package-json");
