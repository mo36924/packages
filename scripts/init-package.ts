import { mkdir, writeFile } from "fs/promises";

const name = process.argv[2];
const workspaceDir = "packages";

if (!/^[a-z][a-z0-9-]*$/.test(name)) {
  throw new Error(`Invalid name: ${name}`);
}

await mkdir(`${workspaceDir}/${name}/src`, { recursive: true });

await Promise.allSettled([
  writeFile(`${workspaceDir}/${name}/package.json`, "{}", { flag: "wx" }),
  writeFile(`${workspaceDir}/${name}/README.md`, `# ${name}\n\n${name}\n`, { flag: "wx" }),
]);

await import("./update-package-json");
