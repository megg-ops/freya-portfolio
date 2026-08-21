export type ShibaAssetGroup =
  | "stand"
  | "look"
  | "turn"
  | "walk"
  | "lie"
  | "restTurn"
  | "breathe";

const framePaths = (folder: string, count: number) =>
  Array.from(
    { length: count },
    (_, index) =>
      `/assets/shiba/${folder}/frame-${String(index + 1).padStart(2, "0")}.webp`,
  );

export const SHIBA_SOURCES = {
  stand: "/assets/shiba/stand-left.webp",
  look: framePaths("look", 33),
  turn: framePaths("turn", 18),
  walk: framePaths("walk", 12),
  lie: framePaths("lie", 53),
  restTurn: framePaths("rest-turn", 26),
  breathe: framePaths("breathe", 20),
} as const;

export const SHIBA_ASSET_ENTRIES: readonly {
  group: ShibaAssetGroup;
  src: string;
}[] = [
  { group: "stand", src: SHIBA_SOURCES.stand },
  ...SHIBA_SOURCES.look.map((src) => ({ group: "look" as const, src })),
  ...SHIBA_SOURCES.turn.map((src) => ({ group: "turn" as const, src })),
  ...SHIBA_SOURCES.walk.map((src) => ({ group: "walk" as const, src })),
  ...SHIBA_SOURCES.lie.map((src) => ({ group: "lie" as const, src })),
  ...SHIBA_SOURCES.restTurn.map((src) => ({ group: "restTurn" as const, src })),
  ...SHIBA_SOURCES.breathe.map((src) => ({ group: "breathe" as const, src })),
];

export const SHIBA_ASSET_TOTAL = SHIBA_ASSET_ENTRIES.length;

export interface ShibaAssetLoadResult {
  images: Map<string, HTMLImageElement>;
  failed: readonly string[];
}

interface LoadShibaAssetsOptions {
  signal: AbortSignal;
  onProgress?: (completed: number) => void;
}

const loadImage = (src: string, signal: AbortSignal) =>
  new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    let settled = false;
    const timeout = window.setTimeout(() => finish(new Error(src)), 20_000);

    const cleanup = () => {
      window.clearTimeout(timeout);
      image.removeEventListener("load", handleLoad);
      image.removeEventListener("error", handleError);
      signal.removeEventListener("abort", handleAbort);
    };
    const finish = (result: HTMLImageElement | Error) => {
      if (settled) return;
      settled = true;
      cleanup();
      if (result instanceof Error) reject(result);
      else resolve(result);
    };
    const handleLoad = () => {
      void image
        .decode()
        .then(() => {
          if (image.naturalWidth > 0) finish(image);
          else finish(new Error(src));
        })
        .catch(() => finish(new Error(src)));
    };
    const handleError = () => finish(new Error(src));
    const handleAbort = () => finish(new DOMException("Aborted", "AbortError"));

    image.decoding = "async";
    image.addEventListener("load", handleLoad, { once: true });
    image.addEventListener("error", handleError, { once: true });
    signal.addEventListener("abort", handleAbort, { once: true });
    image.src = src;
  });

export async function loadShibaAssets({
  signal,
  onProgress,
}: LoadShibaAssetsOptions): Promise<ShibaAssetLoadResult> {
  const images = new Map<string, HTMLImageElement>();
  const failed: string[] = [];
  let completed = 0;

  await Promise.all(
    SHIBA_ASSET_ENTRIES.map(async ({ src }) => {
      try {
        const image = await loadImage(src, signal);
        if (!signal.aborted) images.set(src, image);
      } catch (error) {
        if (!(error instanceof DOMException && error.name === "AbortError")) {
          failed.push(src);
        }
      } finally {
        completed += 1;
        if (!signal.aborted) onProgress?.(completed);
      }
    }),
  );

  return { images, failed };
}
