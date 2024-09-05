import { ok } from "node:assert";
import { mkdirSync, writeFileSync } from "node:fs";
import { argv } from "node:process";
import validate from "validate-npm-package-name";

const workspaceDir = "packages";
const name = argv[2];
const { validForNewPackages, validForOldPackages } = validate(name);
ok(validForNewPackages && validForOldPackages);
mkdirSync(`${workspaceDir}/${name}/src`, { recursive: true });
writeFileSync(`${workspaceDir}/${name}/package.json`, "{}", { flag: "wx" });
writeFileSync(`${workspaceDir}/${name}/README.md`, `# ${name}\n\n${name}\n`, { flag: "wx" });
await import("./update-package-json");
