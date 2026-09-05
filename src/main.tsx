import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";

import { App } from "./app/App";
import { asset } from "./lib/asset";
import "./styles/reset.css";
import "./styles/tokens.css";
import "./styles/seasons.css";
import "./styles/globals.css";

// CSS 里的 url() 绝对路径不会被 Vite 按 base 改写，蝴蝶指针改由这里注入。
document.documentElement.style.setProperty(
  "--butterfly-cursor",
  `url("${asset("/assets/ui/butterfly-cursor.png")}")`,
);

const rootElement = document.getElementById("root");

if (!rootElement) {
  throw new Error("Missing #root element.");
}

createRoot(rootElement).render(
  <StrictMode>
    {/* 子路径部署时路由前缀必须跟着 base 走，否则 / 匹配不上。 */}
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <App />
    </BrowserRouter>
  </StrictMode>,
);
