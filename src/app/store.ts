import { create } from "zustand";

export type World = "daylight" | "stars";
export type Season = "spring" | "summer" | "autumn" | "winter";
export type TreePhase = "loading" | "growing" | "idle";

interface SiteState {
  world: World;
  season: Season;
  treePhase: TreePhase;
  setTreePhase: (phase: TreePhase) => void;
}

export const useSiteStore = create<SiteState>((set) => ({
  world: "daylight",
  season: "spring",
  treePhase: "loading",
  setTreePhase: (treePhase) => set({ treePhase }),
}));
