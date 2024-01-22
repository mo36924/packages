import { dirname } from "node:path";
import { fileURLToPath } from "node:url";
import app from "@mo36924/vite-plugin-solid";
import { InlineConfig, build } from "vite";
import { describe, it } from "vitest";

describe("vite-plugin-solid", () => {
  const config: InlineConfig = { root: dirname(fileURLToPath(import.meta.url)), logLevel: "silent" };

  it("build client", async () => {
    await build({ ...config, plugins: [app({ buildServer: false })] });
  });

  it("build server", async () => {
    await build({ ...config, build: { ssr: true }, plugins: [app({ external: ["@mo36924/http-server"] })] });
  });
});
