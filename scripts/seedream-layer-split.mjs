#!/usr/bin/env node

import { mkdir, readFile, writeFile } from "node:fs/promises";
import { basename, extname, join, resolve } from "node:path";

const inputPath = resolve(process.argv[2] ?? "assets/樱花树-春-v6.png");
const outputDir = resolve(process.argv[3] ?? "assets/tree-2.5d/spring/seedream-v1");
const apiKey = process.env.ARK_API_KEY;
const baseUrl = (process.env.ARK_BASE_URL ?? "https://ark.cn-beijing.volces.com/api/v3").replace(/\/$/, "");
const model = process.env.ARK_MODEL ?? "doubao-seedream-5-0-pro-260628";

if (!apiKey) {
  throw new Error("ARK_API_KEY is not configured.");
}

const source = await readFile(inputPath);
const extension = extname(inputPath).toLowerCase();
const mimeType = extension === ".jpg" || extension === ".jpeg" ? "image/jpeg" : "image/png";
const image = `data:${mimeType};base64,${source.toString("base64")}`;

const prompt = `
将图片进行精确图层分离。不要重新设计或重新绘制，不要改变构图、树形、枝干粗细、花朵位置、颜色、水彩笔触和边缘细节，重组后应尽可能还原输入图。

请拆出以下元素：
1. 暖白色背景底图；
2. 完整树根、树干、主枝和细枝，主体范围约为 <bbox>150 275 850 980</bbox>；
3. 左上主枝花簇，范围约为 <bbox>50 75 500 410</bbox>；
4. 中央主枝花簇，范围约为 <bbox>300 25 700 525</bbox>；
5. 右上主枝花簇，范围约为 <bbox>500 75 965 425</bbox>；
6. 左下主枝花簇，范围约为 <bbox>25 275 520 610</bbox>；
7. 右下主枝花簇，范围约为 <bbox>480 250 975 620</bbox>。

五组花层之间不要重复元素，不要加入文字、标签、阴影、水印、边框或棋盘格。
`.trim();

const response = await fetch(`${baseUrl}/images/generations`, {
  method: "POST",
  headers: {
    Authorization: `Bearer ${apiKey}`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    model,
    prompt,
    image,
    layer_decomposition: true,
    size: "auto",
    output_format: "png",
    response_format: "b64_json",
    watermark: false,
  }),
});

const body = await response.json().catch(() => null);
if (!response.ok) {
  const message = body?.error?.message ?? body?.message ?? `HTTP ${response.status}`;
  const code = body?.error?.code ?? body?.code ?? "unknown_error";
  throw new Error(`${code}: ${message}`);
}

const items = Array.isArray(body?.data) ? body.data : [];
if (items.length === 0) {
  throw new Error("Seedream returned no image layers.");
}

await mkdir(outputDir, { recursive: true });
const outputs = [];
for (let index = 0; index < items.length; index += 1) {
  const item = items[index];
  let bytes;
  if (item.b64_json) {
    bytes = Buffer.from(item.b64_json, "base64");
  } else if (item.url) {
    const download = await fetch(item.url);
    if (!download.ok) throw new Error(`Layer ${index + 1} download failed: HTTP ${download.status}`);
    bytes = Buffer.from(await download.arrayBuffer());
  } else {
    throw new Error(`Layer ${index + 1} has neither b64_json nor url.`);
  }

  const zIndex = Number.isInteger(item.z_index) ? item.z_index : index;
  const name = zIndex === 0 ? "background" : "layer";
  const filename = `${String(zIndex).padStart(2, "0")}-${name}.png`;
  await writeFile(join(outputDir, filename), bytes);
  outputs.push({
    filename,
    bytes: bytes.length,
    reportedSize: item.size ?? null,
    outputFormat: item.output_format ?? null,
    zIndex,
    name: item.name ?? null,
    description: item.description ?? null,
    boundingBox: item.bounding_box ?? null,
  });
}

await writeFile(
  join(outputDir, "request.json"),
  `${JSON.stringify({ model, input: basename(inputPath), size: "auto", layerDecomposition: true, prompt, outputs }, null, 2)}\n`,
);

console.log(JSON.stringify({ ok: true, model, layerCount: outputs.length, outputDir, outputs }, null, 2));
