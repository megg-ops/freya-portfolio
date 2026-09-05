import { Route, Routes } from "react-router-dom";

import { ContactPage } from "../pages/ContactPage";
import { NotFoundPage } from "../pages/NotFoundPage";
import { ResumePage } from "../pages/ResumePage";
import { DaylightScene } from "../scenes/daylight/DaylightScene";

/**
 * 项目详情是叠在日光首屏之上的弹层，所以 `/` 和 `/projects/:id` 必须共用
 * 同一个 DaylightScene 实例——用布局路由承载，避免路由切换时整棵树重新
 * 生长、163 帧柴犬重新加载。未知 id 由 DaylightScene 内部转交 404。
 */
export function App() {
  return (
    <Routes>
      <Route element={<DaylightScene />}>
        <Route index element={null} />
        <Route path="projects/:projectId" element={null} />
      </Route>
      <Route path="/resume" element={<ResumePage />} />
      <Route path="/contact" element={<ContactPage />} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
