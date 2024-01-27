import { dirname } from "node:path";
import { fileURLToPath } from "node:url";
import solid from "@mo36924/vite-plugin-solid";
import { build } from "vite";
import { describe, it } from "vitest";

process.chdir(dirname(fileURLToPath(import.meta.url)));

describe("vite-plugin-solid", () => {
  it("build client", async () => {
    await build({ logLevel: "silent", plugins: [solid({ buildServer: false })] });
  });

  it("build server", async () => {
    await build({ logLevel: "silent", build: { ssr: true }, plugins: [solid({ external: /^[@a-z]/ })] });
  });
});
