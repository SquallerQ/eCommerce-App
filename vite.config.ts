import * as path from "path";
import { defineConfig } from "vite";

export default defineConfig({
  resolve: {
    alias: {
      react: path.resolve("./node_modules/react"),
    },
  },
});
