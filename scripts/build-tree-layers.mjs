import { execFileSync } from "node:child_process";
import { mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

const projectRoot = resolve(import.meta.dirname, "..");
const width = 1122;
const height = 1402;
const pixelCount = width * height;
const rawBytes = pixelCount * 4;
const tempRoot = "/tmp/freya-tree-layers";

const sources = {
  skeleton: resolve(projectRoot, "assets/樱花树枝干.png"),
  spring: resolve(projectRoot, "assets/樱花树-春-v6.png"),
};

const outputRoot = resolve(projectRoot, "assets/tree-2.5d");
const commonRoot = resolve(outputRoot, "common");
const springRoot = resolve(outputRoot, "spring");
const includeSpring = process.argv.includes("--include-spring-experiment");

mkdirSync(tempRoot, { recursive: true });
mkdirSync(commonRoot, { recursive: true });
mkdirSync(springRoot, { recursive: true });

const branchPolygons = {
  "left-low": [
    [36, 470], [250, 430], [430, 520], [558, 690],
    [585, 760], [460, 815], [180, 790], [30, 690],
  ],
  "left-high": [
    [52, 150], [350, 55], [510, 160], [585, 415],
    [540, 590], [488, 646], [315, 555], [70, 430],
  ],
  center: [
    [350, 18], [760, 18], [765, 245], [680, 470],
    [630, 700], [548, 700], [535, 430], [400, 220],
  ],
  "right-high": [
    [650, 70], [1010, 115], [1100, 275], [1090, 530],
    [875, 600], [690, 585], [595, 705], [590, 645],
  ],
  "right-low": [
    [600, 620], [770, 510], [1045, 470], [1110, 620],
    [1060, 800], [760, 825], [590, 780],
  ],
};

const anchors = {
  "left-low": [558, 710],
  "left-high": [488, 626],
  center: [581, 393],
  "right-high": [611, 680],
  "right-low": [611, 748],
};

function runFfmpeg(args) {
  execFileSync("ffmpeg", ["-y", "-hide_banner", "-loglevel", "error", ...args], {
    stdio: "inherit",
  });
}

function decodePng(path, label) {
  const rawPath = resolve(tempRoot, `${label}-source.rgba`);
  runFfmpeg(["-i", path, "-f", "rawvideo", "-pix_fmt", "rgba", "-frames:v", "1", rawPath]);
  const buffer = readFileSync(rawPath);
  if (buffer.length !== rawBytes) {
    throw new Error(`${label}: expected ${rawBytes} RGBA bytes, received ${buffer.length}`);
  }
  return buffer;
}

function encodePng(buffer, path, label) {
  if (buffer.length !== rawBytes) throw new Error(`${label}: invalid RGBA buffer length`);
  mkdirSync(dirname(path), { recursive: true });
  const rawPath = resolve(tempRoot, `${label}.rgba`);
  writeFileSync(rawPath, buffer);
  runFfmpeg([
    "-f", "rawvideo", "-pix_fmt", "rgba", "-s", `${width}x${height}`,
    "-i", rawPath, "-frames:v", "1", "-c:v", "png", path,
  ]);
}

function median(values) {
  values.sort((a, b) => a - b);
  return values[Math.floor(values.length / 2)];
}

function sampleBorderKey(buffer) {
  const red = [];
  const green = [];
  const blue = [];
  const band = 6;
  const step = 4;
  const add = (x, y) => {
    const offset = (y * width + x) * 4;
    red.push(buffer[offset]);
    green.push(buffer[offset + 1]);
    blue.push(buffer[offset + 2]);
  };
  for (let x = 0; x < width; x += step) {
    for (let y = 0; y < band; y += 1) {
      add(x, y);
      add(x, height - 1 - y);
    }
  }
  for (let y = 0; y < height; y += step) {
    for (let x = 0; x < band; x += 1) {
      add(x, y);
      add(width - 1 - x, y);
    }
  }
  return [median(red), median(green), median(blue)];
}

function colorDistance(buffer, pixelIndex, key) {
  const offset = pixelIndex * 4;
  return Math.max(
    Math.abs(buffer[offset] - key[0]),
    Math.abs(buffer[offset + 1] - key[1]),
    Math.abs(buffer[offset + 2] - key[2]),
  );
}

function smoothstep(value) {
  const t = Math.max(0, Math.min(1, value));
  return t * t * (3 - 2 * t);
}

function extractConnectedMatte(source, { threshold = 32, minInteriorArea = 72 } = {}) {
  const key = sampleBorderKey(source);
  const candidate = new Uint8Array(pixelCount);
  const background = new Uint8Array(pixelCount);
  const visited = new Uint8Array(pixelCount);
  const queue = new Int32Array(pixelCount);

  for (let index = 0; index < pixelCount; index += 1) {
    candidate[index] = colorDistance(source, index, key) <= threshold ? 1 : 0;
  }

  let head = 0;
  let tail = 0;
  const enqueue = (index) => {
    if (!candidate[index] || background[index]) return;
    background[index] = 1;
    queue[tail++] = index;
  };

  for (let x = 0; x < width; x += 1) {
    enqueue(x);
    enqueue((height - 1) * width + x);
  }
  for (let y = 0; y < height; y += 1) {
    enqueue(y * width);
    enqueue(y * width + width - 1);
  }

  while (head < tail) {
    const index = queue[head++];
    const x = index % width;
    const y = Math.floor(index / width);
    if (x > 0) enqueue(index - 1);
    if (x + 1 < width) enqueue(index + 1);
    if (y > 0) enqueue(index - width);
    if (y + 1 < height) enqueue(index + width);
  }

  const component = [];
  for (let start = 0; start < pixelCount; start += 1) {
    if (!candidate[start] || background[start] || visited[start]) continue;
    component.length = 0;
    head = 0;
    tail = 0;
    visited[start] = 1;
    queue[tail++] = start;
    while (head < tail) {
      const index = queue[head++];
      component.push(index);
      const x = index % width;
      const y = Math.floor(index / width);
      const neighbors = [];
      if (x > 0) neighbors.push(index - 1);
      if (x + 1 < width) neighbors.push(index + 1);
      if (y > 0) neighbors.push(index - width);
      if (y + 1 < height) neighbors.push(index + width);
      for (const neighbor of neighbors) {
        if (candidate[neighbor] && !background[neighbor] && !visited[neighbor]) {
          visited[neighbor] = 1;
          queue[tail++] = neighbor;
        }
      }
    }
    if (component.length >= minInteriorArea) {
      for (const index of component) background[index] = 1;
    }
  }

  const output = Buffer.alloc(rawBytes);
  let transparent = 0;
  let partial = 0;
  for (let index = 0; index < pixelCount; index += 1) {
    const sourceOffset = index * 4;
    if (background[index]) {
      output[sourceOffset] = 0;
      output[sourceOffset + 1] = 0;
      output[sourceOffset + 2] = 0;
      output[sourceOffset + 3] = 0;
      transparent += 1;
      continue;
    }

    const x = index % width;
    const y = Math.floor(index / width);
    let touchesBackground = false;
    for (let dy = -1; dy <= 1 && !touchesBackground; dy += 1) {
      for (let dx = -1; dx <= 1; dx += 1) {
        if (dx === 0 && dy === 0) continue;
        const nx = x + dx;
        const ny = y + dy;
        if (nx < 0 || nx >= width || ny < 0 || ny >= height) continue;
        if (background[ny * width + nx]) {
          touchesBackground = true;
          break;
        }
      }
    }

    const distance = colorDistance(source, index, key);
    let alpha = 255;
    if (touchesBackground) {
      alpha = Math.round(255 * smoothstep((distance - 4) / 34));
      alpha = Math.max(24, alpha);
      if (alpha < 255) partial += 1;
    }
    const normalizedAlpha = alpha / 255;
    for (let channel = 0; channel < 3; channel += 1) {
      const observed = source[sourceOffset + channel];
      const clean = alpha < 250
        ? (observed - key[channel] * (1 - normalizedAlpha)) / Math.max(normalizedAlpha, 0.001)
        : observed;
      output[sourceOffset + channel] = Math.max(0, Math.min(255, Math.round(clean)));
    }
    output[sourceOffset + 3] = alpha;
  }

  return { buffer: output, key, transparent, partial };
}

function pointInPolygon(x, y, polygon) {
  let inside = false;
  for (let index = 0, previous = polygon.length - 1; index < polygon.length; previous = index++) {
    const [xi, yi] = polygon[index];
    const [xj, yj] = polygon[previous];
    const intersects = ((yi > y) !== (yj > y))
      && (x < ((xj - xi) * (y - yi)) / (yj - yi) + xi);
    if (intersects) inside = !inside;
  }
  return inside;
}

function maskLayer(source, predicate) {
  const output = Buffer.alloc(rawBytes);
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      if (!predicate(x, y)) continue;
      const offset = (y * width + x) * 4;
      output[offset] = source[offset];
      output[offset + 1] = source[offset + 1];
      output[offset + 2] = source[offset + 2];
      output[offset + 3] = source[offset + 3];
    }
  }
  return output;
}

function polygonPredicate(polygon) {
  return (x, y) => pointInPolygon(x + 0.5, y + 0.5, polygon);
}

function trunkRootsPredicate(x, y) {
  if (y >= 700) return true;
  if (y < 340) return false;
  const halfWidth = 26 + Math.max(0, y - 340) * 0.055;
  const centerX = 585 + Math.max(0, y - 340) * 0.012;
  return x >= centerX - halfWidth && x <= centerX + halfWidth;
}

function crownPredicate(polygon) {
  const base = polygonPredicate(polygon);
  return (x, y) => y < 835 && base(x, y);
}

function countAlpha(buffer) {
  let visible = 0;
  let partial = 0;
  for (let index = 0; index < pixelCount; index += 1) {
    const alpha = buffer[index * 4 + 3];
    if (alpha > 0) visible += 1;
    if (alpha > 0 && alpha < 255) partial += 1;
  }
  return { visible, partial };
}

function buildSource(name, sourcePath, outputPath, matteOptions) {
  const source = decodePng(sourcePath, name);
  const matte = extractConnectedMatte(source, matteOptions);
  encodePng(matte.buffer, outputPath, `${name}-transparent`);
  console.log(`${name}: key=${matte.key.join(",")} transparent=${matte.transparent} partial=${matte.partial}`);
  return matte.buffer;
}

const skeleton = buildSource(
  "skeleton",
  sources.skeleton,
  resolve(commonRoot, "skeleton-transparent.png"),
  { threshold: 30, minInteriorArea: pixelCount + 1 },
);
const commonLayers = {
  "trunk-roots": maskLayer(skeleton, trunkRootsPredicate),
};
for (const [id, polygon] of Object.entries(branchPolygons)) {
  commonLayers[`branch-${id}`] = maskLayer(skeleton, polygonPredicate(polygon));
}
for (const [name, buffer] of Object.entries(commonLayers)) {
  encodePng(buffer, resolve(commonRoot, `${name}.png`), `common-${name}`);
}

const springLayers = {};
if (includeSpring) {
  const spring = buildSource(
    "spring",
    sources.spring,
    resolve(springRoot, "spring-transparent-experimental.png"),
    { threshold: 32, minInteriorArea: pixelCount + 1 },
  );
  springLayers["trunk-roots-experimental"] = maskLayer(spring, trunkRootsPredicate);
  for (const [id, polygon] of Object.entries(branchPolygons)) {
    springLayers[`crown-${id}-experimental`] = maskLayer(spring, crownPredicate(polygon));
  }
  for (const [name, buffer] of Object.entries(springLayers)) {
    encodePng(buffer, resolve(springRoot, `${name}.png`), `spring-${name}`);
  }
}

const manifest = {
  version: 1,
  status: includeSpring ? "spring-alpha-experimental" : "skeleton-layers-ready",
  canvas: { width, height },
  sources: {
    skeleton: "../../樱花树枝干.png",
    spring: "../../樱花树-春-v6.png",
  },
  anchors,
  zOrder: [
    "common/trunk-roots.png",
    "common/branch-left-high.png",
    "common/branch-right-high.png",
    "common/branch-center.png",
    "common/branch-left-low.png",
    "common/branch-right-low.png",
  ],
  layers: {},
};
for (const [name, buffer] of Object.entries(commonLayers)) {
  manifest.layers[`common/${name}`] = countAlpha(buffer);
}
for (const [name, buffer] of Object.entries(springLayers)) {
  manifest.layers[`spring/${name}`] = countAlpha(buffer);
}
writeFileSync(resolve(outputRoot, "manifest.json"), `${JSON.stringify(manifest, null, 2)}\n`);

rmSync(tempRoot, { recursive: true, force: true });
console.log(`Wrote transparent tree layers to ${outputRoot}`);
