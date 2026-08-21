import type { Season } from "../../app/store";

export const ACTIVE_SEASON = "spring" satisfies Season;

interface SpringAssets {
  status: "ready";
  daylightShell: {
    figure: string;
    treeReference: string;
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
      figure: "/assets/freya-spring-cutout.png",
      treeReference: "/assets/tree-spring-full.svg",
    },
    // These are the six layers used by the validated spring demo. Tree migration
    // will publish and consume them without changing the season interface.
    treeLayers: [
      "assets/tree-2.5d/spring/seedream-native-v1/02-layer.png",
      "assets/tree-2.5d/spring/seedream-native-v1/03-layer.png",
      "assets/tree-2.5d/spring/seedream-native-v1/04-layer.png",
      "assets/tree-2.5d/spring/seedream-native-v1/05-layer.png",
      "assets/tree-2.5d/spring/seedream-native-v1/06-layer.png",
      "assets/tree-2.5d/spring/seedream-native-v1/07-layer.png",
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
