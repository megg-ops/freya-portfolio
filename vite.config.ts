import { defineConfig } from "vite";

export default defineConfig({
  optimizeDeps: {
    entries: ["index.html"],
  },
  build: {
    // Vite 8's native Oxc minifier currently crashes with SIGBUS in this WSL2
    // environment. Keep production builds reliable until that toolchain issue is
    // resolved; asset-format optimization remains a separate follow-up task.
    minify: false,
    outDir: "dist",
  },
});
