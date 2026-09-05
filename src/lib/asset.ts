/**
 * public/ 下的静态资源路径。
 *
 * 站点可能部署在子路径（如 GitHub Pages 的 `/freya-portfolio/`），也可能部署
 * 在自定义域的根路径。写死 `/assets/...` 在子路径下会全部 404，所以统一经过
 * 这里拼上 Vite 注入的 BASE_URL。BASE_URL 结尾一定带 `/`。
 */
export const asset = (path: string) =>
  `${import.meta.env.BASE_URL}${path.replace(/^\//, "")}`;
