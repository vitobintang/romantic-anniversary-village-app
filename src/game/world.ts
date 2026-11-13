import {
  Cvs,
  Sprite,
  mulberry32,
} from "./px";
import {
  buildHouse,
  buildTree,
  buildBush,
  buildFountain,
  buildLamp,
  buildStall,
  buildBarrel,
  buildCrate,
  buildBench,
  buildHay,
  buildArch,
  buildEasel,
  buildLadder,
  buildBucket,
  buildTopiary,
  buildHeartSprite,
  buildBalloon,
  buildGround,
  HouseArt,
  HouseSpec,
  PathSeg,
} from "./scenery";
import { MEMORIES, Memory, NPCS } from "./config";

export const WW = 896;
export const WH = 704;

export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}
export interface Obj {
  kind: string;
  x: number;
  y: number;
  sprite: Sprite;
  sortY: number;
}
export interface HouseInst {
  id: string;
  x: number;
  y: number;
  art: HouseArt;
  memory?: Memory;
  zone: { x: number; y: number };
  top: number;
}
export interface Glow {
  x: number;
  y: number;
  r: number;
  seed: number;
}
export interface Bunting {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  sag: number;
}
export interface World {
  ground: Cvs;
  objs: Obj[];
  solids: Rect[];
  houses: HouseInst[];
  glows: Glow[];
  chimneys: { x: number; y: number }[];
  bunting: Bunting[];
  balloons: { x: number; y: number; col: number; ph: number }[];
  fountain: { x: number; y: number };
  pond: { x: number; y: number; rx: number; ry: number };
  hearts: Record<string, Cvs>;
  balloonSprites: Cvs[];
  ladders: Obj[];
}

const HOUSES: { id: string; x: number; y: number; spec: HouseSpec; interactive: boolean }[] = [
  {
    id: "nw",
    x: 150,
    y: 190,
    interactive: true,
    spec: { w: 64, roofH: 28, wallH: 38, roof: "thatch", roofCol: "#e0ae4b", wall: "plaster", wallCol: "#fbefe0", trim: "#6a4430", shutter: "#d86c8a", sign: "heart", chimney: true, seed: 1 },
  },
  {
    id: "n",
    x: 448,
    y: 162,
    interactive: true,
    spec: { w: 80, roofH: 32, wallH: 42, roof: "tile", roofCol: "#e0587f", wall: "plaster", wallCol: "#fff4ee", trim: "#7a4a5a", shutter: "#ff9ec4", sign: "star", chimney: true, gableHeart: true, seed: 2 },
  },
  {
    id: "ne",
    x: 750,
    y: 190,
    interactive: true,
    spec: { w: 64, roofH: 28, wallH: 38, roof: "slate", roofCol: "#5f7fc4", wall: "stone", wallCol: "#b9b4c4", trim: "#3d3560", shutter: "#8aa8e8", sign: "star", chimney: true, seed: 3 },
  },
  {
    id: "w",
    x: 130,
    y: 432,
    interactive: true,
    spec: { w: 64, roofH: 28, wallH: 38, roof: "tile", roofCol: "#c24a3a", wall: "plaster", wallCol: "#f6e2c4", trim: "#6a4430", shutter: "#3f7d4a", sign: "bread", chimney: true, seed: 4 },
  },
  {
    id: "e",
    x: 770,
    y: 432,
    interactive: true,
    spec: { w: 64, roofH: 28, wallH: 38, roof: "shingle", roofCol: "#8a5a3a", wall: "wood", wallCol: "#c4966a", trim: "#5a3a26", shutter: "#d86c8a", sign: "cup", chimney: true, seed: 5 },
  },
  {
    id: "sw",
    x: 190,
    y: 602,
    interactive: true,
    spec: { w: 64, roofH: 28, wallH: 38, roof: "tile", roofCol: "#4fb3a9", wall: "plaster", wallCol: "#fff1e6", trim: "#2f6f6a", shutter: "#ff9ec4", sign: "flower", seed: 6 },
  },
  {
    id: "wip",
    x: 710,
    y: 602,
    interactive: false,
    spec: { w: 64, roofH: 28, wallH: 38, roof: "thatch", roofCol: "#e0ae4b", wall: "plaster", wallCol: "#f3e6d3", trim: "#6a4430", shutter: "#d86c8a", unfinished: true, sign: "heart", seed: 7 },
  },
];

const PATHS: PathSeg[] = [
  { pts: [[448, 470], [448, 704]], hw: 14, cobble: true },
  { pts: [[448, 168], [448, 296]], hw: 12, cobble: true },
  { pts: [[150, 198], [150, 250], [300, 330], [366, 372]], hw: 11 },
  { pts: [[750, 198], [750, 250], [600, 330], [530, 372]], hw: 11 },
  { pts: [[130, 440], [130, 472], [260, 440], [366, 404]], hw: 11 },
  { pts: [[770, 440], [770, 472], [640, 440], [530, 404]], hw: 11 },
  { pts: [[190, 610], [190, 640], [448, 640]], hw: 12 },
  { pts: [[710, 610], [710, 640], [448, 640]], hw: 12 },
];
const PLAZA = { x: 448, y: 380, r: 88 };
const POND = { x: 630, y: 548, rx: 44, ry: 26 };
const HEARTBED = { x: 290, y: 548, size: 56 };
const BLANKET = { x: 552, y: 562 };
const FENCES: [number, number, number, number][] = [
  [60, 214, 130, 214],
  [60, 214, 60, 270],
  [60, 270, 130, 270],
];
export const PEN = { x1: 66, y1: 220, x2: 122, y2: 266 };

function distSeg(px: number, py: number, ax: number, ay: number, bx: number, by: number) {
  const dx = bx - ax;
  const dy = by - ay;
  const l2 = dx * dx + dy * dy || 1;
  const t = Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / l2));
  return Math.hypot(px - (ax + dx * t), py - (ay + dy * t));
}

export function buildWorld(): World {
  const objs: Obj[] = [];
  const solids: Rect[] = [];
  const glows: Glow[] = [];
  const houses: HouseInst[] = [];
  const chimneys: { x: number; y: number }[] = [];
  const keepOut: { x: number; y: number; r: number }[] = [];
  const ladders: Obj[] = [];

  const ground = buildGround({
    W: WW,
    H: WH,
    paths: PATHS,
    plaza: PLAZA,
    pond: POND,
    heartBed: HEARTBED,
    blanket: BLANKET,
    fences: FENCES,
    mosaic: { x: 448, y: 426, size: 44 },
    seed: 77,
  });

  const add = (kind: string, x: number, y: number, sprite: Sprite, col?: Rect) => {
    const o: Obj = { kind, x, y, sprite, sortY: y };
    objs.push(o);
    if (col) solids.push({ x: x + col.x, y: y + col.y, w: col.w, h: col.h });
    keepOut.push({ x, y, r: 16 });
    return o;
  };

  // houses
  for (const h of HOUSES) {
    const art = buildHouse(h.spec);
    const sprite: Sprite = { c: art.c, ax: art.ax, ay: art.ay };
    objs.push({ kind: "house", x: h.x, y: h.y, sprite, sortY: h.y });
    const w = h.spec.w;
    solids.push({ x: h.x - w / 2 - 2, y: h.y - h.spec.wallH - 8, w: w + 4, h: h.spec.wallH + 8 });
    const mem = MEMORIES.find((m) => m.id === h.id);
    houses.push({ id: h.id, x: h.x, y: h.y, art, memory: mem, zone: { x: h.x, y: h.y + 16 }, top: h.y - (h.spec.roofH + h.spec.wallH + 8) });
    for (const l of art.lamps) glows.push({ x: h.x - art.ax + l.x, y: h.y - art.ay + l.y, r: 26, seed: h.x + l.x });
    if (art.chimney) chimneys.push({ x: h.x - art.ax + art.chimney.x, y: h.y - art.ay + art.chimney.y });
  }

  // central fountain
  const fountain = { x: 448, y: 364 };
  add("fountain", fountain.x, fountain.y, buildFountain(), { x: -25, y: -16, w: 50, h: 20 });

  // lamp posts
  const lampSprite = buildLamp();
  const lamps: [number, number][] = [
    [366, 300],
    [530, 300],
    [340, 380],
    [556, 380],
    [380, 452],
    [516, 452],
    [420, 540],
    [476, 540],
    [420, 610],
    [476, 610],
  ];
  for (const [x, y] of lamps) {
    add("lamp", x, y, lampSprite, { x: -3, y: -4, w: 6, h: 5 });
    glows.push({ x: x - 0, y: y - 36, r: 44, seed: x + y });
  }

  // market stalls
  add("stall", 346, 502, buildStall("#e0384f", "apples"), { x: -22, y: -12, w: 44, h: 12 });
  add("stall", 550, 502, buildStall("#ff7fa8", "flowers"), { x: -22, y: -12, w: 44, h: 12 });

  // benches
  const bench = buildBench();
  add("bench", 396, 296, bench, { x: -16, y: -6, w: 32, h: 7 });
  add("bench", 500, 296, bench, { x: -16, y: -6, w: 32, h: 7 });

  // barrels/crates/hay
  const barrel = buildBarrel();
  const crate = buildCrate();
  add("barrel", 172, 448, barrel, { x: -5, y: -5, w: 10, h: 6 });
  add("barrel", 184, 452, barrel, { x: -5, y: -5, w: 10, h: 6 });
  add("crate", 96, 452, crate, { x: -6, y: -6, w: 12, h: 7 });
  add("barrel", 810, 448, barrel, { x: -5, y: -5, w: 10, h: 6 });
  add("crate", 822, 452, crate, { x: -6, y: -6, w: 12, h: 7 });
  add("crate", 92, 614, crate, { x: -6, y: -6, w: 12, h: 7 });
  add("hay", 84, 300, buildHay(), { x: -12, y: -8, w: 24, h: 9 });
  add("hay", 236, 224, buildHay(), { x: -12, y: -8, w: 24, h: 9 });

  // topiaries
  const topiary = buildTopiary();
  for (const [x, y] of [
    [418, 238],
    [478, 238],
    [406, 668],
    [490, 668],
  ])
    add("topiary", x, y, topiary, { x: -8, y: -6, w: 16, h: 7 });

  // rose bushes
  const bushes: [number, number][] = [
    [86, 198],
    [214, 198],
    [384, 168],
    [514, 168],
    [686, 198],
    [814, 198],
    [78, 440],
    [186, 436],
    [704, 442],
    [836, 442],
    [126, 612],
    [254, 612],
    [644, 612],
    [330, 332],
    [566, 332],
    [330, 432],
    [566, 432],
    [250, 640],
    [660, 676],
    [236, 676],
  ];
  bushes.forEach(([x, y], i) => add("bush", x, y, buildBush(i + 1, i % 3 !== 0), { x: -9, y: -4, w: 18, h: 5 }));

  // painter's easel & decorator gear
  add("easel", 668, 372, buildEasel(), { x: -11, y: -5, w: 22, h: 6 });
  const ladderSpr = buildLadder();
  ladders.push(add("ladder", 540, 318, ladderSpr, { x: -5, y: -4, w: 10, h: 5 }));
  ladders.push(add("ladder", 770, 616, ladderSpr, { x: -5, y: -4, w: 10, h: 5 }));
  add("bucket", 728, 626, buildBucket());
  add("bucket", 676, 380, buildBucket());

  // gate arch
  add("arch", 448, 706, buildArch(), undefined);
  solids.push({ x: 448 - 42, y: 706 - 8, w: 11, h: 10 });
  solids.push({ x: 448 + 32, y: 706 - 8, w: 11, h: 10 });

  // fences
  for (const [x1, y1, x2, y2] of FENCES) {
    if (y1 === y2) solids.push({ x: x1, y: y1 - 6, w: x2 - x1, h: 6 });
    else solids.push({ x: x1 - 2, y: y1 - 6, w: 4, h: y2 - y1 + 6 });
  }

  // trees ---------------------------------------------------------
  const treeSprites: Sprite[] = [];
  for (let i = 0; i < 6; i++) treeSprites.push(buildTree("oak", i));
  for (let i = 0; i < 3; i++) treeSprites.push(buildTree("blossom", i + 10));
  const rnd = mulberry32(2024);
  const placed: [number, number][] = [];
  const pickTree = (blossomBias: number) =>
    rnd() < blossomBias ? treeSprites[6 + Math.floor(rnd() * 3)] : treeSprites[Math.floor(rnd() * 6)];
  const putTree = (x: number, y: number, bias: number) => {
    placed.push([x, y]);
    add("tree", x, y, pickTree(bias), { x: -4, y: -5, w: 8, h: 6 });
  };
  const inGate = (x: number, y: number) => x > 396 && x < 500 && y > 600;
  // border
  for (let x = 6; x < WW; x += 24) {
    const jx = x + Math.floor(rnd() * 8);
    putTree(jx, 40 + Math.floor(rnd() * 6), 0.3);
    putTree(jx + 12, 64 + Math.floor(rnd() * 6), 0.3);
    if (!inGate(jx, 700)) putTree(jx, 706 + Math.floor(rnd() * 4), 0.2);
  }
  for (let y = 80; y < WH - 20; y += 26) {
    const jy = y + Math.floor(rnd() * 8);
    putTree(10 + Math.floor(rnd() * 6), jy, 0.3);
    putTree(WW - 10 - Math.floor(rnd() * 6), jy, 0.3);
    if (jy < 640 || jy > 700) {
      putTree(34 + Math.floor(rnd() * 6), jy + 12, 0.25);
      putTree(WW - 34 - Math.floor(rnd() * 6), jy + 12, 0.25);
    }
  }
  for (const d of NPCS) keepOut.push({ x: d.x, y: d.y, r: 0 });
  // scatter
  const houseBoxes = HOUSES.map((h) => ({
    x0: h.x - h.spec.w / 2 - 22,
    x1: h.x + h.spec.w / 2 + 22,
    y0: h.y - h.spec.roofH - h.spec.wallH + 4,
    y1: h.y + 34,
  }));
  for (let i = 0; i < 900 && placed.length < 200; i++) {
    const x = 40 + rnd() * (WW - 80);
    const y = 88 + rnd() * (WH - 150);
    let ok = true;
    for (const p of PATHS) {
      for (let k = 0; k < p.pts.length - 1 && ok; k++) {
        if (distSeg(x, y, p.pts[k][0], p.pts[k][1], p.pts[k + 1][0], p.pts[k + 1][1]) < p.hw + 18) ok = false;
      }
    }
    if (!ok) continue;
    if (Math.hypot(x - PLAZA.x, y - PLAZA.y) < PLAZA.r + 22) continue;
    if (Math.hypot((x - POND.x) / (POND.rx + 22), (y - POND.y) / (POND.ry + 22)) < 1) continue;
    if (Math.abs(x - HEARTBED.x) < 44 && Math.abs(y - HEARTBED.y) < 42) continue;
    if (Math.abs(x - BLANKET.x) < 34 && Math.abs(y - BLANKET.y) < 28) continue;
    if (x > 50 && x < 142 && y > 200 && y < 284) continue;
    if (houseBoxes.some((b) => x > b.x0 && x < b.x1 && y > b.y0 && y < b.y1)) continue;
    if (keepOut.some((k) => Math.hypot(k.x - x, k.y - y) < 24)) continue;
    if (placed.some(([px, py]) => Math.hypot(px - x, py - y) < 27)) continue;
    if (Math.abs(x - 448) < 40 && y > 560) continue;
    // keep villager spawn areas clear
    if (Math.hypot(x - 700, y - 340) < 40 || Math.hypot(x - 742, y - 262) < 30 || Math.hypot(x - 535, y - 596) < 34) continue;
    putTree(Math.round(x), Math.round(y), 0.35);
  }

  objs.sort((a, b) => a.sortY - b.sortY);

  const bunting: Bunting[] = [
    { x1: 366, y1: 262, x2: 530, y2: 262, sag: 14 },
    { x1: 366, y1: 262, x2: 340, y2: 342, sag: 6 },
    { x1: 340, y1: 342, x2: 380, y2: 414, sag: 6 },
    { x1: 380, y1: 414, x2: 516, y2: 414, sag: 12 },
    { x1: 516, y1: 414, x2: 556, y2: 342, sag: 6 },
    { x1: 556, y1: 342, x2: 530, y2: 262, sag: 6 },
    { x1: 420, y1: 502, x2: 476, y2: 502, sag: 8 },
    { x1: 420, y1: 572, x2: 476, y2: 572, sag: 8 },
    { x1: 420, y1: 572, x2: 476, y2: 502, sag: 6 },
  ];

  const balloons: { x: number; y: number; col: number; ph: number }[] = [];
  lamps.slice(0, 6).forEach(([x, y], i) => {
    balloons.push({ x: x + 6, y: y - 38, col: i % 3, ph: i * 1.3 });
    balloons.push({ x: x - 5, y: y - 40, col: (i + 1) % 3, ph: i * 1.7 + 2 });
  });

  return {
    ground,
    objs,
    solids,
    houses,
    glows,
    chimneys,
    bunting,
    balloons,
    fountain,
    pond: POND,
    hearts: {
      red: buildHeartSprite("#ff3b6b", 7),
      pink: buildHeartSprite("#ff9ec4", 7),
      gold: buildHeartSprite("#ffd84d", 9),
      big: buildHeartSprite("#ff3b6b", 11),
      bigGold: buildHeartSprite("#ffd84d", 11),
      small: buildHeartSprite("#ff6f91", 5),
    },
    balloonSprites: [buildBalloon("#ff3b6b"), buildBalloon("#ff9ec4"), buildBalloon("#ffd84d")],
    ladders,
  };
}
