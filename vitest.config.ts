import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: false,
  },
  resolve: {
    alias: {
      "@": new URL("./src", import.meta.url).pathname,
    },
  },
});
