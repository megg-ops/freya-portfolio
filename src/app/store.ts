import { create } from "zustand";

export type World = "daylight" | "stars";
export type Season = "spring" | "summer" | "autumn" | "winter";
export type Overlay = "resume" | "mailbox" | null;
export type TreePhase = "loading" | "growing" | "idle";

interface SiteState {
  world: World;
  season: Season;
  activeProject: string | null;
  overlay: Overlay;
  treePhase: TreePhase;
}

export const useSiteStore = create<SiteState>(() => ({
  world: "daylight",
  season: "spring",
  activeProject: null,
  overlay: null,
  treePhase: "loading",
}));
