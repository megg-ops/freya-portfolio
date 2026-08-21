import { Route, Routes } from "react-router-dom";

import { DaylightScene } from "../scenes/daylight/DaylightScene";

export function App() {
  return (
    <Routes>
      <Route path="/" element={<DaylightScene />} />
    </Routes>
  );
}
