#!/usr/bin/env node

import { readFile } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import { dirname, join, resolve } from "node:path";

const manifestPath = resolve(process.argv[2] ?? "assets/tree-2.5d/spring/seedream-native-v1/request.json");
const layerDir = dirname(manifestPath);
const manifest = JSON.parse(await readFile(manifestPath, "utf8"));
const background = manifest.outputs.find((item) => item.zIndex === 0);

if (!background) throw new Error("The layer manifest has no z-index 0 background.");

const [canvasWidth, canvasHeight] = background.reportedSize.split("x").map(Number);
const layers = manifest.outputs
  .filter((item) => item.zIndex > 0 && item.boundingBox?.absolute)
  .filter((item) => !item.name?.includes("背景"))
  .sort((a, b) => a.zIndex - b.zIndex);

function render({ transparent, filename }) {
  const args = ["-y", "-v", "error"];
  if (transparent) {
    args.push("-f", "lavfi", "-i", `color=c=black@0.0:s=${canvasWidth}x${canvasHeight},format=rgba`);
  } else {
    args.push("-i", join(layerDir, background.filename));
  }
  for (const layer of layers) args.push("-i", join(layerDir, layer.filename));

  const filters = [];
  let previous = "0:v";
  layers.forEach((layer, index) => {
    const [left, top, right, bottom] = layer.boundingBox.absolute;
    const width = right - left;
    const height = bottom - top;
    const scaled = `scaled${index}`;
    const composed = `composed${index}`;
    filters.push(`[${index + 1}:v]scale=${width}:${height}:flags=lanczos,format=rgba[${scaled}]`);
    filters.push(`[${previous}][${scaled}]overlay=${left}:${top}:format=auto[${composed}]`);
    previous = composed;
  });

  args.push(
    "-filter_complex",
    filters.join(";"),
    "-map",
    `[${previous}]`,
    "-frames:v",
    "1",
    "-pix_fmt",
    transparent ? "rgba" : "rgb24",
    join(layerDir, filename),
  );

  const result = spawnSync("ffmpeg", args, { encoding: "utf8" });
  if (result.status !== 0) throw new Error(result.stderr || `ffmpeg exited with ${result.status}`);
}

render({ transparent: false, filename: "spring-recomposed.png" });
render({ transparent: true, filename: "spring-tree-transparent.png" });

console.log(
  JSON.stringify(
    {
      ok: true,
      canvas: `${canvasWidth}x${canvasHeight}`,
      includedLayers: layers.map((layer) => ({ zIndex: layer.zIndex, name: layer.name, boundingBox: layer.boundingBox.absolute })),
      outputs: ["spring-recomposed.png", "spring-tree-transparent.png"],
    },
    null,
    2,
  ),
);
