import type { Season } from "../../app/store";

export const ACTIVE_SEASON = "spring" satisfies Season;

interface SpringAssets {
  status: "ready";
  daylightShell: {
    figure: string;
  };
  treeLayers: readonly [string, string, string, string, string, string];
}

interface StaticOnlyAssets {
  status: "static-only";
  referenceImage: string;
}

type SeasonAssets = SpringAssets | StaticOnlyAssets;

export const SEASON_ASSETS = {
  spring: {
    status: "ready",
    daylightShell: {
      figure: "/assets/freya-spring-cutout-clean.png",
    },
    treeLayers: [
      "/assets/tree/spring/02-layer.png",
      "/assets/tree/spring/03-layer.png",
      "/assets/tree/spring/04-layer.png",
      "/assets/tree/spring/05-layer.png",
      "/assets/tree/spring/06-layer.png",
      "/assets/tree/spring/07-layer.png",
    ],
  },
  summer: {
    status: "static-only",
    referenceImage: "assets/樱花树-夏-v2.png",
  },
  autumn: {
    status: "static-only",
    referenceImage: "assets/樱花树-秋-v3.png",
  },
  winter: {
    status: "static-only",
    referenceImage: "assets/樱花树-冬-v2.png",
  },
} satisfies Record<Season, SeasonAssets>;
