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
  setActiveProject: (activeProject: string | null) => void;
  setOverlay: (overlay: Overlay) => void;
  setTreePhase: (phase: TreePhase) => void;
}

export const useSiteStore = create<SiteState>((set) => ({
  world: "daylight",
  season: "spring",
  activeProject: null,
  overlay: null,
  treePhase: "loading",
  setActiveProject: (activeProject) => set({ activeProject }),
  setOverlay: (overlay) => set({ overlay }),
  setTreePhase: (treePhase) => set({ treePhase }),
}));
