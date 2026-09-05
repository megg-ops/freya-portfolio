import type { Season } from "../../app/store";
import { asset } from "../../lib/asset";

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
      figure: asset("/assets/freya-spring-cutout-clean.webp"),
    },
    treeLayers: [
      asset("/assets/tree/spring/02-layer.webp"),
      asset("/assets/tree/spring/03-layer.webp"),
      asset("/assets/tree/spring/04-layer.webp"),
      asset("/assets/tree/spring/05-layer.webp"),
      asset("/assets/tree/spring/06-layer.webp"),
      asset("/assets/tree/spring/07-layer.webp"),
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
