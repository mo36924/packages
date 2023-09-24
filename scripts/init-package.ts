import { ok } from "assert";
import { mkdir, writeFile } from "fs/promises";
import validate from "validate-npm-package-name";

const workspaceDir = "packages";
const name = process.argv[2];
const { validForNewPackages, validForOldPackages } = validate(name);
ok(validForNewPackages && validForOldPackages);

await mkdir(`${workspaceDir}/${name}/src`, { recursive: true });

await Promise.allSettled([
  writeFile(`${workspaceDir}/${name}/package.json`, "{}", { flag: "wx" }),
  writeFile(`${workspaceDir}/${name}/README.md`, `# ${name}\n\n${name}\n`, { flag: "wx" }),
]);

await import("./update-package-json");
