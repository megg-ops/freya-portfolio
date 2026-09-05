import { defineConfig } from "vite";

export default defineConfig({
  // 部署在子路径（如 GitHub Pages 的 /freya-portfolio/）时由 BASE_PATH 指定；
  // 绑定自定义域后走根路径，保持默认 "/"。结尾必须带 "/"。
  base: process.env.BASE_PATH ?? "/",
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
