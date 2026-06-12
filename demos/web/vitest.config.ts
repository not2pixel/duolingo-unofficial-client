import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@duohacker/duolingo": fileURLToPath(new URL("../../src/index.ts", import.meta.url))
    }
  }
});
