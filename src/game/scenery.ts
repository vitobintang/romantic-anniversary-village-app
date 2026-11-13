import {
  mk,
  R,
  disc,
  ell,
  shade,
  hash,
  mulberry32,
  heartShape,
  heartOutlined,
  heartMask,
  finish,
  Cvs,
  Ctx,
  Sprite,
} from "./px";

// ============================ HOUSES ============================
export interface HouseSpec {
  w: number;
  roofH: number;
  wallH: number;
  roof: "thatch" | "tile" | "slate" | "shingle";
  roofCol: string;
  wall: "plaster" | "stone" | "wood";
  wallCol: string;
  trim: string;
  shutter: string;
  sign?: "heart" | "star" | "bread" | "cup" | "flower" | "book";
  chimney?: boolean;
  gableHeart?: boolean;
  unfinished?: boolean;
  seed: number;
}

export interface HouseArt extends Sprite {
  w: number;
  h: number;
  doorX: number; // canvas coords of door bottom centre
  doorY: number;
  wallTop: number;
  x0: number;
  x1: number;
  lamps: { x: number; y: number }[];
  chimney?: { x: number; y: number };
}

function roofColor(s: HouseSpec, x: number, y: number, xa: number, xb: number): string {
  const base = s.roofCol;
  const dk = shade(base, -0.28);
  const lt = shade(base, 0.18);
  if (x === xa || x === xb) return shade(base, -0.5);
  if (y >= s.roofH - 1) return shade(base, -0.42);
  if (s.roof === "thatch") {
    const n = hash(x, y >> 1, s.seed);
    let col = base;
    if (n < 0.22) col = dk;
    else if (n > 0.8) col = lt;
    if (y % 9 === 8) col = shade(base, -0.35);
    if (y > s.roofH - 4 && hash(x, y, 3) < 0.3) col = dk;
    return col;
  }
  const band = s.roof === "slate" ? 5 : 4;
  const seamW = s.roof === "slate" ? 8 : 6;
  const row = Math.floor(y / band);
  const off = (row % 2) * (seamW / 2);
  const ry = y % band;
  if (ry === band - 1) return dk;
  if ((x + off) % seamW === 0) return shade(base, -0.18);
  if (ry === 0) return lt;
  return hash(x, row, s.seed) < 0.15 ? shade(base, 0.07) : base;
}

function signIcon(g: Ctx, kind: string, cx: number, cy: number) {
  if (kind === "heart") heartOutlined(g, "#ff5a86", "#7d1f45", cx, cy, 5);
  else if (kind === "star") {
    R(g, "#ffd84d", cx - 1, cy - 3, 3, 7);
    R(g, "#ffd84d", cx - 3, cy - 1, 7, 3);
    R(g, "#fff3a8", cx, cy - 1, 1, 1);
  } else if (kind === "bread") {
    R(g, "#c9803e", cx - 3, cy - 1, 7, 4);
    R(g, "#e8a85c", cx - 2, cy - 2, 5, 2);
    R(g, "#8a5222", cx - 1, cy, 1, 1);
    R(g, "#8a5222", cx + 1, cy, 1, 1);
  } else if (kind === "cup") {
    R(g, "#ffffff", cx - 2, cy - 2, 5, 5);
    R(g, "#7a4a2a", cx - 2, cy - 2, 5, 1);
    R(g, "#ffffff", cx + 3, cy - 1, 1, 2);
    R(g, "#ff7fa8", cx - 1, cy, 3, 1);
  } else if (kind === "flower") {
    R(g, "#ff7fa8", cx - 1, cy - 3, 3, 3);
    R(g, "#ff7fa8", cx - 3, cy - 1, 7, 3);
    R(g, "#ffd84d", cx, cy - 1, 1, 1);
    R(g, "#3f9b4a", cx, cy + 2, 1, 2);
  } else if (kind === "book") {
    R(g, "#7b4fb3", cx - 3, cy - 3, 7, 7);
    R(g, "#f5ecd8", cx - 2, cy - 2, 5, 5);
    R(g, "#c9a24c", cx - 1, cy - 1, 3, 1);
    R(g, "#c9a24c", cx - 1, cy + 1, 3, 1);
  }
}

export function buildHouse(s: HouseSpec): HouseArt {
  const pad = 12;
  const W = s.w + pad * 2;
  const H = s.roofH + s.wallH + 12;
  const { c, g } = mk(W, H);
  const cx = Math.round(W / 2);
  const x0 = pad;
  const x1 = pad + s.w;
  const roofY = 12;
  const wTop = roofY + s.roofH - 6;
  const wBot = wTop + s.wallH;
  const lamps: { x: number; y: number }[] = [];
  const INK = "#3a2a30";

  // chimney (behind roof)
  let chimney: { x: number; y: number } | undefined;
  if (s.chimney) {
    const chx = Math.round(cx + s.w * 0.22);
    R(g, "#8a7f86", chx, 3, 8, 18);
    R(g, "#a79da3", chx, 3, 3, 18);
    R(g, "#5d545c", chx - 1, 2, 10, 3);
    R(g, "#2f2830", chx + 2, 2, 4, 1);
    chimney = { x: chx + 4, y: 1 };
  }

  // ----- walls -----
  R(g, INK, x0 - 1, wTop, s.w + 2, s.wallH + 1);
  R(g, s.wallCol, x0, wTop, s.w, s.wallH);
  const wr = mulberry32(s.seed * 17 + 3);
  if (s.wall === "plaster") {
    for (let i = 0; i < s.w * 2; i++) {
      R(g, shade(s.wallCol, -0.07), x0 + Math.floor(wr() * s.w), wTop + Math.floor(wr() * s.wallH), 1, 1);
    }
    R(g, shade(s.wallCol, -0.1), x0, wTop + s.wallH - 8, s.w, 3);
    R(g, s.trim, x0, wTop, s.w, 3);
    R(g, s.trim, x0, wTop, 3, s.wallH - 5);
    R(g, s.trim, x1 - 3, wTop, 3, s.wallH - 5);
    R(g, s.trim, x0, wTop + 6 + Math.floor(s.wallH * 0.45), s.w, 2);
    for (let i = 0; i < 7; i++) {
      R(g, s.trim, x0 + 3 + i, wTop + 3 + i, 2, 1);
      R(g, s.trim, x1 - 5 - i, wTop + 3 + i, 2, 1);
    }
  } else if (s.wall === "stone") {
    for (let y = 0; y < s.wallH; y += 4) {
      const off = ((y / 4) % 2) * 4;
      for (let x = -off; x < s.w; x += 8) {
        const n = hash(x, y, s.seed);
        const col = shade(s.wallCol, (n - 0.5) * 0.18);
        const xx = Math.max(0, x);
        const ww = Math.min(7, s.w - xx, x + 7 - xx);
        if (ww > 0) {
          R(g, col, x0 + xx, wTop + y, ww, 3);
          R(g, shade(col, 0.12), x0 + xx, wTop + y, ww, 1);
        }
      }
    }
    R(g, s.trim, x0, wTop, s.w, 2);
    R(g, s.trim, x0, wTop, 2, s.wallH - 5);
    R(g, s.trim, x1 - 2, wTop, 2, s.wallH - 5);
  } else {
    for (let x = 0; x < s.w; x += 4) {
      R(g, shade(s.wallCol, hash(x, 1, s.seed) * 0.1 - 0.05), x0 + x, wTop, 3, s.wallH);
      R(g, shade(s.wallCol, -0.25), x0 + x + 3, wTop, 1, s.wallH);
    }
    R(g, s.trim, x0, wTop, s.w, 2);
    R(g, s.trim, x0, wTop + s.wallH - 9, s.w, 2);
    R(g, s.trim, x0, wTop, 2, s.wallH);
    R(g, s.trim, x1 - 2, wTop, 2, s.wallH);
  }
  // foundation
  R(g, "#8d8794", x0, wBot - 5, s.w, 5);
  for (let x = 0; x < s.w; x += 6) {
    R(g, "#6f6a7a", x0 + x, wBot - 5, 1, 5);
    R(g, "#a39ba8", x0 + x + 1, wBot - 5, 4, 1);
  }
  R(g, "#6f6a7a", x0, wBot - 3, s.w, 1);

  // ----- windows -----
  const winY = wTop + 12;
  const drawWin = (wx: number) => {
    R(g, s.trim === "#ffffff" ? "#fff" : shade(s.trim, -0.2), wx - 1, winY - 1, 13, 13);
    R(g, "#fff1b8", wx, winY, 11, 5);
    R(g, "#ffd27a", wx, winY + 5, 11, 6);
    R(g, "rgba(255,255,255,0.55)", wx + 1, winY + 1, 3, 2);
    R(g, shade(s.trim, 0.1), wx + 5, winY, 1, 11);
    R(g, shade(s.trim, 0.1), wx, winY + 5, 11, 1);
    R(g, "#ff9ec4", wx + 1, winY + 6, 3, 5);
    R(g, "#ff9ec4", wx + 7, winY + 6, 3, 5);
    R(g, s.shutter, wx - 4, winY - 1, 3, 13);
    R(g, s.shutter, wx + 12, winY - 1, 3, 13);
    R(g, shade(s.shutter, -0.25), wx - 3, winY + 1, 1, 9);
    R(g, shade(s.shutter, -0.25), wx + 13, winY + 1, 1, 9);
    R(g, "#6b4226", wx - 2, winY + 12, 15, 3);
    R(g, "#8a5a34", wx - 2, winY + 12, 15, 1);
    const fc = ["#ff4d7d", "#ff9ec4", "#ffffff", "#ff6f91"];
    for (let i = 0; i < 7; i++) {
      R(g, "#3f9b4a", wx - 1 + i * 2, winY + 10, 2, 2);
      R(g, fc[i % 4], wx - 1 + i * 2, winY + 9 + (i % 2), 2, 2);
    }
  };
  drawWin(Math.round(x0 + s.w * 0.2 - 5));
  drawWin(Math.round(x1 - s.w * 0.2 - 6));

  // ----- door -----
  const dx = cx - 7;
  const dy = wBot - 20;
  R(g, "#3a2418", dx - 2, dy - 2, 18, 22);
  R(g, "#8a5a3a", dx, dy, 14, 20);
  for (let i = 0; i < 4; i++) R(g, "#6e4529", dx + 3 + i * 4 - (i === 3 ? 1 : 0), dy, 1, 20);
  R(g, "#a0704a", dx, dy, 14, 1);
  R(g, "#5a3820", dx, dy + 10, 14, 1);
  R(g, "#ffd35a", dx + 10, dy + 11, 2, 2);
  R(g, "#a39ba8", dx - 3, dy - 5, 20, 3);
  R(g, "#c7c0cc", dx - 3, dy - 5, 20, 1);
  R(g, "#a39ba8", dx - 3, wBot, 20, 2);
  R(g, "#837b88", dx - 1, wBot + 2, 16, 2);
  heartOutlined(g, "#ff4d78", "#8a1f45", cx, dy + 8, 9);
  R(g, "#3f9b4a", cx - 7, dy + 9, 2, 1);
  R(g, "#3f9b4a", cx + 6, dy + 9, 2, 1);
  const lamp = (lx: number, ly: number) => {
    R(g, "#2a2a2e", lx, ly - 3, 1, 3);
    R(g, "#2a2a2e", lx - 2, ly, 5, 1);
    R(g, "#ffcf66", lx - 1, ly + 1, 3, 4);
    R(g, "#fff3b0", lx, ly + 2, 1, 2);
    R(g, "#2a2a2e", lx - 2, ly + 5, 5, 1);
    lamps.push({ x: lx, y: ly + 3 });
  };
  lamp(dx - 9, dy + 3);
  lamp(dx + 22, dy + 3);

  // ----- roof -----
  const topHalf = Math.max(5, Math.round(s.w * 0.16));
  const botHalf = Math.round(s.w / 2) + 6;
  for (let y = 0; y < s.roofH; y++) {
    const t = y / (s.roofH - 1);
    const half = Math.round(topHalf + (botHalf - topHalf) * t);
    const xa = cx - half;
    const xb = cx + half;
    for (let x = xa; x <= xb; x++) {
      let col = roofColor(s, x, y, xa, xb);
      if (s.unfinished && x > cx + 4 && y >= 4 && x < xb && y < s.roofH - 1) {
        col = "#4a3426";
        if ((x - cx + y) % 7 === 0) col = "#c79a62";
        else if (y % 7 === 3) col = "#8a6840";
      }
      R(g, col, x, roofY + y, 1, 1);
    }
  }
  R(g, shade(s.roofCol, 0.18), cx - topHalf - 1, roofY - 1, topHalf * 2 + 3, 2);
  R(g, shade(s.roofCol, -0.3), cx - topHalf - 1, roofY + 1, topHalf * 2 + 3, 1);
  R(g, "rgba(40,20,40,0.32)", x0 - 1, roofY + s.roofH, s.w + 2, 3);
  if (s.gableHeart) {
    heartOutlined(g, "#ffd86b", "#6a2a3a", cx, roofY + Math.round(s.roofH * 0.55), 11);
    R(g, "#fff3b0", cx - 2, roofY + Math.round(s.roofH * 0.55) - 2, 2, 2);
  }
  if (!s.unfinished) {
    // heart finial on the ridge
    heartOutlined(g, "#ff5a86", "#7d1f45", cx - topHalf + 2, roofY - 3, 5);
  }

  // ----- garland of hearts under the eaves -----
  if (!s.unfinished) {
    const gy = roofY + s.roofH + 1;
    for (let x = x0 - 3; x <= x1 + 3; x++) {
      const yo = Math.round(Math.abs(Math.sin(((x - x0) / s.w) * Math.PI * 4)) * 2);
      R(g, "#d6a86a", x, gy + yo, 1, 1);
    }
    for (let i = 0, x = x0; x <= x1; x += 8, i++) {
      const yo = Math.round(Math.abs(Math.sin(((x - x0) / s.w) * Math.PI * 4)) * 2);
      heartOutlined(g, i % 2 ? "#ff5d8f" : "#ff9ec4", "#9a2a56", x, gy + yo + 4, 5);
    }
  } else {
    // scaffold on the right-hand side
    R(g, "#a0764a", x1 + 3, roofY + 6, 3, wBot - roofY - 6);
    R(g, "#a0764a", x1 - 12, roofY + 6, 3, 3);
    R(g, "#c9985a", x1 - 12, wTop + 15, 18, 3);
    R(g, "#8a6234", x1 - 12, wTop + 18, 18, 1);
    R(g, "#c9985a", x1 - 12, roofY + 14, 18, 3);
    R(g, "#8a6234", x1 + 3, wTop - 6, 3, 1);
    R(g, "#a0764a", x1 - 12, roofY + 6, 18, 2);
    R(g, "#c9985a", x0 - 6, wTop + 8, 6, 2);
    // half-hung bunting
    for (let i = 0; i < 3; i++) heartOutlined(g, i % 2 ? "#ff5d8f" : "#ff9ec4", "#9a2a56", x0 + 4 + i * 8, roofY + s.roofH + 4, 5);
  }

  // ----- hanging sign -----
  if (s.sign) {
    R(g, "#3a2418", x1, wTop + 14, 9, 2);
    R(g, "#3a2418", x1 + 2, wTop + 16, 1, 2);
    R(g, "#3a2418", x1 + 7, wTop + 16, 1, 2);
    R(g, "#3a2418", x1 + 1, wTop + 18, 8, 10);
    R(g, "#f1d9a6", x1 + 2, wTop + 19, 6, 8);
    signIcon(g, s.sign, x1 + 5, wTop + 23);
  }

  // ----- foundation bushes & roses -----
  for (const bx of [x0 + 2, x1 - 2, cx - 17, cx + 17]) {
    disc(g, "#2f7d3c", bx, wBot - 2, 4);
    disc(g, "#44a54f", bx - 1, wBot - 3, 3);
    for (let i = 0; i < 6; i++) {
      const rx = bx - 3 + Math.floor(wr() * 7);
      const ry = wBot - 5 + Math.floor(wr() * 5);
      R(g, ["#ff4d7d", "#ff9ec4", "#ffffff", "#ff6f91"][i % 4], rx, ry, 1, 1);
    }
  }

  return { c, ax: cx, ay: wBot, w: W, h: H, doorX: cx, doorY: wBot, wallTop: wTop, x0, x1, lamps, chimney };
}

// ============================ TREES ============================
export function buildTree(kind: "oak" | "blossom", seed: number): Sprite {
  const { c, g } = mk(42, 52);
  const pals =
    kind === "blossom"
      ? [["#c2477b", "#ee6b9d", "#ff9cc0", "#ffe0ec"]]
      : [
          ["#1f6b3a", "#2f8f46", "#52b559", "#9be07f"],
          ["#2a6b31", "#3f9a3c", "#6bc255", "#b4eb8e"],
        ];
  const pal = pals[seed % pals.length];
  const r = mulberry32(seed * 101 + 7);
  R(g, "#5a3a26", 18, 36, 6, 12);
  R(g, "#7a5236", 18, 36, 2, 12);
  R(g, "#3e2819", 16, 46, 10, 2);
  const blobs: [number, number, number][] = [
    [21, 24, 15],
    [10, 29, 9],
    [32, 29, 9],
    [15, 14, 10],
    [27, 14, 10],
  ];
  for (const [x, y, rr] of blobs) disc(g, pal[0], x, y + 1, rr);
  for (const [x, y, rr] of blobs) disc(g, pal[1], x - 1, y - 1, rr - 2);
  for (const [x, y, rr] of blobs) if (rr >= 9) disc(g, pal[2], x - 3, y - 4, rr - 6);
  for (let i = 0; i < 70; i++) {
    const [x, y, rr] = blobs[Math.floor(r() * blobs.length)];
    const a = r() * Math.PI * 2;
    const d = r() * (rr - 2);
    const px = Math.round(x + Math.cos(a) * d);
    const py = Math.round(y + Math.sin(a) * d);
    R(g, r() < 0.5 ? pal[3] : pal[0], px, py, 2, 1);
  }
  if (kind === "blossom") {
    for (let i = 0; i < 10; i++) {
      const [x, y, rr] = blobs[Math.floor(r() * blobs.length)];
      heartShape(g, "#ff4d7d", Math.round(x + (r() - 0.5) * rr), Math.round(y + (r() - 0.5) * rr), 3);
    }
  } else if (seed % 3 === 0) {
    // sweet little red heart-apples
    for (let i = 0; i < 4; i++) {
      const [x, y, rr] = blobs[Math.floor(r() * blobs.length)];
      R(g, "#ff3b5c", Math.round(x + (r() - 0.5) * rr), Math.round(y + (r() - 0.5) * rr) + 2, 2, 2);
    }
  }
  return finish(c, 21, 48, "#16381f");
}

export function buildBush(seed: number, roses: boolean): Sprite {
  const { c, g } = mk(24, 16);
  const r = mulberry32(seed * 31 + 5);
  disc(g, "#245f33", 6, 10, 5);
  disc(g, "#245f33", 17, 10, 5);
  disc(g, "#245f33", 12, 7, 6);
  disc(g, "#3b9647", 5, 9, 4);
  disc(g, "#3b9647", 16, 9, 4);
  disc(g, "#4cb558", 11, 6, 4);
  const cols = roses ? ["#ff3b6b", "#ff6f91", "#ff9bb6", "#ffffff"] : ["#ffffff", "#fff3a8", "#ffc2d9"];
  for (let i = 0; i < (roses ? 9 : 6); i++) {
    const x = 3 + Math.floor(r() * 18);
    const y = 3 + Math.floor(r() * 10);
    R(g, cols[i % cols.length], x, y, 2, 2);
    R(g, "rgba(0,0,0,0.25)", x, y + 1, 2, 1);
  }
  return finish(c, 12, 14, "#16381f");
}

// ============================ PROPS ============================
const WOOD = "#8a5a34";
const WOODL = "#b07a46";
const WOODD = "#5a3a26";

export function buildFountain(): Sprite {
  const { c, g } = mk(60, 58);
  ell(g, "#6f6a7c", 30, 46, 28, 10);
  ell(g, "#bdb7cc", 30, 44, 28, 10);
  ell(g, "#8f89a0", 30, 45, 24, 8);
  ell(g, "#6dc2ef", 30, 44, 23, 7);
  ell(g, "#9edcff", 30, 43, 19, 5);
  ell(g, "#6dc2ef", 30, 44, 12, 3);
  R(g, "#e3f7ff", 14, 43, 5, 1);
  R(g, "#e3f7ff", 40, 45, 6, 1);
  R(g, "#e3f7ff", 24, 47, 4, 1);
  for (let i = 0; i < 8; i++) heartShape(g, "#ff9ec4", 8 + i * 6, 52, 3);
  R(g, "#b9b3c8", 26, 26, 8, 18);
  R(g, "#8f89a0", 31, 26, 3, 18);
  R(g, "#d7d1e3", 26, 26, 2, 18);
  ell(g, "#bdb7cc", 30, 29, 13, 4);
  ell(g, "#6dc2ef", 30, 28, 10, 2);
  for (const x of [18, 22, 38, 42]) R(g, "#cdefff", x, 31, 1, 11);
  R(g, "#cdefff", 29, 15, 2, 12);
  heartOutlined(g, "#ff5a86", "#8c1f48", 30, 14, 16);
  R(g, "#fff3b0", 24, 8, 3, 2);
  return finish(c, 30, 54, "#3a3045");
}

export function buildLamp(): Sprite {
  const { c, g } = mk(22, 48);
  R(g, "#2d2d36", 10, 12, 2, 32);
  R(g, "#45454f", 10, 12, 1, 32);
  R(g, "#2d2d36", 7, 42, 8, 3);
  R(g, "#2d2d36", 8, 40, 6, 2);
  R(g, "#2d2d36", 7, 3, 8, 2);
  R(g, "#ffd36e", 8, 5, 6, 7);
  R(g, "#fff6c2", 10, 6, 2, 5);
  R(g, "#2d2d36", 7, 12, 8, 2);
  R(g, "#2d2d36", 10, 0, 2, 3);
  R(g, "#2d2d36", 12, 16, 8, 2);
  R(g, "#e63b5d", 14, 18, 6, 10);
  R(g, "#ff6f8c", 14, 18, 6, 2);
  R(g, "#e63b5d", 15, 28, 4, 1);
  R(g, "#e63b5d", 16, 29, 2, 1);
  heartShape(g, "#ffe3ec", 17, 22, 4);
  return finish(c, 11, 44, "#1b1b22");
}

export function buildStall(c1: string, goods: "apples" | "flowers"): Sprite {
  const { c, g } = mk(48, 44);
  R(g, WOODD, 5, 12, 3, 30);
  R(g, WOODD, 40, 12, 3, 30);
  R(g, WOOD, 6, 29, 36, 12);
  for (let x = 8; x < 42; x += 6) R(g, WOODD, x, 29, 1, 12);
  R(g, WOODL, 4, 27, 40, 3);
  if (goods === "apples") {
    for (let i = 0; i < 6; i++) {
      disc(g, "#d92b45", 10 + i * 6, 25, 2);
      R(g, "#ff7a8c", 9 + i * 6, 24, 1, 1);
    }
  } else {
    for (let i = 0; i < 5; i++) {
      R(g, "#a0522d", 9 + i * 7, 24, 5, 4);
      heartShape(g, i % 2 ? "#ff5d8f" : "#ffd1e3", 11 + i * 7, 21, 5);
      R(g, "#3f9b4a", 11 + i * 7, 23, 1, 2);
    }
  }
  for (let i = 0; i < 8; i++) {
    const x = i * 6;
    const col = i % 2 ? "#ffffff" : c1;
    R(g, col, x, 4, 6, 9);
    ell(g, col, x + 3, 13, 3, 2);
    R(g, "rgba(255,255,255,0.25)", x, 4, 6, 2);
    R(g, "rgba(0,0,0,0.15)", x, 11, 6, 1);
  }
  heartOutlined(g, "#ff5a86", "#7d1f45", 24, 2, 7);
  return finish(c, 24, 42, "#3a2430");
}

export function buildBarrel(): Sprite {
  const { c, g } = mk(14, 17);
  R(g, WOOD, 2, 3, 10, 12);
  R(g, WOODL, 3, 3, 3, 12);
  ell(g, WOODL, 7, 3, 5, 2);
  ell(g, WOODD, 7, 3, 3, 1);
  R(g, "#3b3b44", 2, 6, 10, 1);
  R(g, "#3b3b44", 2, 12, 10, 1);
  return finish(c, 7, 15);
}

export function buildCrate(): Sprite {
  const { c, g } = mk(15, 15);
  R(g, WOOD, 1, 1, 13, 13);
  R(g, WOODL, 1, 1, 13, 2);
  R(g, WOODD, 1, 1, 2, 13);
  R(g, WOODD, 12, 1, 2, 13);
  R(g, WOODD, 1, 12, 13, 2);
  for (let i = 0; i < 9; i++) R(g, WOODD, 2 + i, 2 + i, 1, 1);
  return finish(c, 7, 14);
}

export function buildBench(): Sprite {
  const { c, g } = mk(34, 20);
  R(g, WOODD, 4, 12, 3, 6);
  R(g, WOODD, 27, 12, 3, 6);
  R(g, "#a8703f", 2, 9, 30, 4);
  R(g, WOODL, 2, 9, 30, 1);
  R(g, "#b87c46", 2, 2, 30, 6);
  R(g, WOODL, 2, 2, 30, 1);
  R(g, WOODD, 2, 7, 30, 1);
  R(g, WOODD, 3, 1, 2, 9);
  R(g, WOODD, 29, 1, 2, 9);
  heartShape(g, "#ff5d8f", 17, 5, 5);
  return finish(c, 17, 18);
}

export function buildHay(): Sprite {
  const { c, g } = mk(28, 22);
  ell(g, "#d9a441", 14, 14, 12, 7);
  ell(g, "#e8bb55", 14, 11, 10, 7);
  ell(g, "#f3cf72", 12, 8, 7, 4);
  for (let i = 0; i < 14; i++) R(g, i % 2 ? "#b8832d" : "#fbe08d", 4 + ((i * 7) % 20), 6 + ((i * 5) % 12), 3, 1);
  R(g, "#b8832d", 3, 15, 22, 1);
  return finish(c, 14, 20, "#4a3516");
}

export function buildArch(): Sprite {
  const { c, g } = mk(92, 62);
  const r = mulberry32(99);
  const leaf = ["#245f33", "#3b9647", "#4cb558"];
  for (const px of [6, 78]) {
    R(g, WOODD, px + 2, 22, 6, 36);
    R(g, WOOD, px + 2, 22, 2, 36);
    for (let i = 0; i < 34; i++) disc(g, leaf[i % 3], px + 2 + Math.floor(r() * 7), 22 + Math.floor(r() * 36), 2);
  }
  for (let a = 0; a <= 60; a++) {
    const t = (a / 60) * Math.PI;
    const x = 46 - Math.cos(t) * 40;
    const y = 26 - Math.sin(t) * 18;
    disc(g, leaf[a % 3], Math.round(x), Math.round(y), 3);
  }
  for (let i = 0; i < 70; i++) {
    const pick = r();
    let x: number;
    let y: number;
    if (pick < 0.55) {
      const t = r() * Math.PI;
      x = 46 - Math.cos(t) * 40 + (r() - 0.5) * 6;
      y = 26 - Math.sin(t) * 18 + (r() - 0.5) * 6;
    } else {
      x = (r() < 0.5 ? 9 : 81) + (r() - 0.5) * 9;
      y = 24 + r() * 32;
    }
    heartShape(g, ["#ff3b6b", "#ff6f91", "#ff9bb6", "#ffffff"][i % 4], Math.round(x), Math.round(y), 3);
  }
  heartOutlined(g, "#ff3b6b", "#7d1f45", 46, 9, 20);
  R(g, "#ffd1e3", 40, 3, 3, 2);
  return finish(c, 46, 58, "#16381f");
}

export function buildEasel(): Sprite {
  const { c, g } = mk(28, 34);
  R(g, WOODD, 5, 14, 2, 18);
  R(g, WOODD, 21, 14, 2, 18);
  R(g, WOODD, 13, 10, 2, 22);
  R(g, "#f5ecd8", 5, 3, 18, 17);
  R(g, "#d9cdb4", 5, 18, 18, 2);
  heartShape(g, "#ff5a86", 14, 11, 10);
  R(g, "#c92a58", 12, 16, 1, 3);
  R(g, WOOD, 4, 20, 20, 2);
  R(g, "#ff5a86", 6, 19, 2, 2);
  R(g, "#4aa8ff", 9, 19, 2, 2);
  return finish(c, 14, 32);
}

export function buildLadder(): Sprite {
  const { c, g } = mk(14, 40);
  R(g, WOODD, 1, 0, 3, 40);
  R(g, WOODD, 10, 0, 3, 40);
  R(g, WOOD, 1, 0, 1, 40);
  R(g, WOOD, 10, 0, 1, 40);
  for (let y = 4; y < 38; y += 6) {
    R(g, WOODL, 4, y, 6, 2);
    R(g, WOODD, 4, y + 2, 6, 1);
  }
  return finish(c, 7, 39);
}

export function buildBucket(): Sprite {
  const { c, g } = mk(12, 12);
  R(g, "#9aa3b2", 2, 3, 8, 7);
  R(g, "#ff7fa8", 2, 3, 8, 3);
  R(g, "#ffb0cb", 3, 3, 3, 1);
  R(g, "#6b7280", 2, 9, 8, 1);
  R(g, "#6b7280", 1, 1, 1, 3);
  R(g, "#6b7280", 10, 1, 1, 3);
  R(g, "#6b7280", 1, 1, 10, 1);
  R(g, "#ff7fa8", 9, 6, 1, 3);
  return finish(c, 6, 10);
}

export function buildTopiary(): Sprite {
  const { c, g } = mk(34, 36);
  R(g, "#a0522d", 11, 28, 12, 7);
  R(g, "#c46a3a", 11, 28, 12, 2);
  heartShape(g, "#245f33", 17, 15, 26);
  heartShape(g, "#3b9647", 16, 14, 22);
  heartShape(g, "#4cb558", 14, 12, 14);
  const r = mulberry32(5);
  for (let i = 0; i < 16; i++) R(g, ["#ff6f91", "#ffffff", "#ffd1e3"][i % 3], 6 + Math.floor(r() * 22), 6 + Math.floor(r() * 18), 2, 2);
  R(g, "#3f9b4a", 15, 26, 3, 3);
  return finish(c, 17, 34, "#16381f");
}

export function buildHeartSprite(col: string, size: number): Cvs {
  const { c, g } = mk(size + 4, size + 4);
  heartOutlined(g, col, shade(col, -0.5), (size + 4) / 2, (size + 4) / 2, size);
  return c;
}

export function buildBalloon(col: string): Cvs {
  const { c, g } = mk(14, 18);
  heartOutlined(g, col, shade(col, -0.5), 7, 7, 12);
  R(g, shade(col, -0.4), 6, 14, 3, 2);
  return c;
}

// ============================ GROUND ============================
export interface PathSeg {
  pts: [number, number][];
  hw: number;
  cobble?: boolean;
}
export interface GroundSpec {
  W: number;
  H: number;
  paths: PathSeg[];
  plaza: { x: number; y: number; r: number };
  pond: { x: number; y: number; rx: number; ry: number };
  heartBed: { x: number; y: number; size: number };
  blanket: { x: number; y: number };
  fences: [number, number, number, number][];
  mosaic: { x: number; y: number; size: number };
  seed: number;
}

export function buildGround(s: GroundSpec): Cvs {
  const T = 16;
  const tw = s.W / T;
  const th = s.H / T;
  const { c, g } = mk(s.W, s.H);
  const mask = new Uint8Array(tw * th);
  const set = (tx: number, ty: number, v: number) => {
    if (tx < 0 || ty < 0 || tx >= tw || ty >= th) return;
    const i = ty * tw + tx;
    if (v > mask[i]) mask[i] = v;
  };
  for (const seg of s.paths) {
    for (let k = 0; k < seg.pts.length - 1; k++) {
      const [ax, ay] = seg.pts[k];
      const [bx, by] = seg.pts[k + 1];
      const len = Math.hypot(bx - ax, by - ay);
      const n = Math.max(1, Math.ceil(len / 3));
      for (let i = 0; i <= n; i++) {
        const px = ax + ((bx - ax) * i) / n;
        const py = ay + ((by - ay) * i) / n;
        const t0x = Math.floor((px - seg.hw) / T);
        const t1x = Math.floor((px + seg.hw) / T);
        const t0y = Math.floor((py - seg.hw) / T);
        const t1y = Math.floor((py + seg.hw) / T);
        for (let ty = t0y; ty <= t1y; ty++)
          for (let tx = t0x; tx <= t1x; tx++) {
            const ccx = tx * T + T / 2;
            const ccy = ty * T + T / 2;
            if (Math.hypot(ccx - px, ccy - py) <= seg.hw + 2) set(tx, ty, seg.cobble ? 2 : 1);
          }
      }
    }
  }
  for (let ty = 0; ty < th; ty++)
    for (let tx = 0; tx < tw; tx++) {
      if (Math.hypot(tx * T + 8 - s.plaza.x, ty * T + 8 - s.plaza.y) <= s.plaza.r) set(tx, ty, 2);
    }
  const m = (tx: number, ty: number) => (tx < 0 || ty < 0 || tx >= tw || ty >= th ? 0 : mask[ty * tw + tx]);

  const rr = mulberry32(s.seed);
  const greens = ["#72c75c", "#6cbf58", "#78cd62", "#68b954"];
  // grass
  for (let ty = 0; ty < th; ty++)
    for (let tx = 0; tx < tw; tx++) {
      const X = tx * T;
      const Y = ty * T;
      const base = greens[Math.floor(hash(tx, ty, 1) * 4)];
      R(g, base, X, Y, T, T);
      for (let i = 0; i < 10; i++) {
        const px = X + Math.floor(rr() * T);
        const py = Y + Math.floor(rr() * T);
        R(g, rr() < 0.5 ? "#5aa749" : "#8ad672", px, py, 1, 1);
      }
      for (let i = 0; i < 2; i++) {
        const px = X + 1 + Math.floor(rr() * 13);
        const py = Y + 2 + Math.floor(rr() * 12);
        R(g, "#4e9c42", px, py, 1, 2);
        R(g, "#4e9c42", px - 1, py - 1, 1, 1);
        R(g, "#4e9c42", px + 1, py - 1, 1, 1);
      }
      if (rr() < 0.2) {
        const px = X + 2 + Math.floor(rr() * 12);
        const py = Y + 2 + Math.floor(rr() * 12);
        const col = ["#ff8fb7", "#ffffff", "#ffe27a", "#d6b3ff", "#ff6f91"][Math.floor(rr() * 5)];
        R(g, col, px, py, 2, 2);
        R(g, "#ffd84d", px, py, 1, 1);
        R(g, "#3f9b4a", px, py + 2, 1, 1);
      }
    }

  // dirt & cobble
  const stones = ["#b9b3c2", "#aaa4b6", "#c6c0d0", "#a39dae"];
  for (let ty = 0; ty < th; ty++)
    for (let tx = 0; tx < tw; tx++) {
      const v = m(tx, ty);
      if (!v) continue;
      const X = tx * T;
      const Y = ty * T;
      if (v === 1) {
        R(g, hash(tx, ty, 2) < 0.5 ? "#d2a96f" : "#caa066", X, Y, T, T);
        for (let i = 0; i < 14; i++) {
          const px = X + Math.floor(rr() * T);
          const py = Y + Math.floor(rr() * T);
          R(g, rr() < 0.5 ? "#b88a52" : "#e3c08c", px, py, rr() < 0.3 ? 2 : 1, 1);
        }
      } else {
        const dcx = X + 8 - s.plaza.x;
        const dcy = Y + 8 - s.plaza.y;
        const dd = Math.hypot(dcx, dcy);
        for (let py = 0; py < T; py++)
          for (let px = 0; px < T; px++) {
            const gx = X + px;
            const gy = Y + py;
            const row = Math.floor(gy / 6);
            const ox = (row & 1) * 4;
            const col = Math.floor((gx + ox) / 9);
            const mortar = gy % 6 === 5 || (gx + ox) % 9 === 8;
            let colr = mortar ? "#706b7c" : stones[Math.floor(hash(col, row, 5) * 4)];
            if (!mortar && gy % 6 === 0) colr = shade(colr, 0.12);
            const dist = Math.hypot(gx - s.plaza.x, gy - s.plaza.y);
            if (dd < s.plaza.r + 24 && dist > s.plaza.r - 12 && dist < s.plaza.r - 7 && dist < s.plaza.r) {
              colr = mortar ? "#b0597a" : ["#f0a8c0", "#e592b0", "#f8bfd0"][Math.floor(hash(col, row, 9) * 3)];
            }
            R(g, colr, gx, gy, 1, 1);
          }
      }
      // soft edges where the path meets grass
      const edge = v === 1 ? "#a07846" : "#6b6575";
      if (m(tx, ty - 1) === 0) R(g, edge, X, Y, T, 1);
      if (m(tx, ty + 1) === 0) R(g, edge, X, Y + T - 1, T, 1);
      if (m(tx - 1, ty) === 0) R(g, edge, X, Y, 1, T);
      if (m(tx + 1, ty) === 0) R(g, edge, X + T - 1, Y, 1, T);
      if (v === 1) {
        for (let i = 0; i < 2; i++) {
          if (m(tx, ty - 1) === 0) R(g, "#5aa749", X + Math.floor(rr() * T), Y - 1, 1, 2);
          if (m(tx, ty + 1) === 0) R(g, "#5aa749", X + Math.floor(rr() * T), Y + T - 1, 1, 2);
        }
      }
    }

  // heart mosaic
  {
    const { x, y, size } = s.mosaic;
    heartShape(g, "#7d1f45", x, y, size + 4);
    const mm = heartMask(size);
    const x0 = Math.round(x - size / 2);
    const y0 = Math.round(y - size / 2);
    for (let py = 0; py < size; py++)
      for (let px = 0; px < size; px++) {
        if (!mm[py * size + px]) continue;
        const row = Math.floor(py / 4);
        const ox = (row & 1) * 2;
        const col = Math.floor((px + ox) / 5);
        const mortar = py % 4 === 3 || (px + ox) % 5 === 4;
        const cols = ["#ef5f8c", "#e04d7c", "#f77a9f", "#ff8fb0"];
        R(g, mortar ? "#b3345c" : cols[Math.floor(hash(col, row, 4) * 4)], x0 + px, y0 + py, 1, 1);
      }
    R(g, "rgba(255,255,255,0.6)", x0 + 6, y0 + 5, 4, 2);
  }

  // pond
  {
    const { x, y, rx, ry } = s.pond;
    ell(g, "#6f5236", x, y + 2, rx + 4, ry + 4);
    ell(g, "#8d6a45", x, y + 1, rx + 3, ry + 3);
    ell(g, "#3e8fd0", x, y + 1, rx, ry);
    ell(g, "#52aaea", x, y, rx - 3, ry - 3);
    ell(g, "#74c4f5", x - 4, y - 2, rx - 14, ry - 8);
    for (let i = 0; i < 12; i++) {
      const a = rr() * Math.PI * 2;
      const d = 0.4 + rr() * 0.5;
      const px = Math.round(x + Math.cos(a) * rx * d);
      const py = Math.round(y + Math.sin(a) * ry * d);
      R(g, "#a9e0ff", px, py, 3 + Math.floor(rr() * 4), 1);
    }
    for (let i = 0; i < 4; i++) {
      const a = rr() * Math.PI * 2;
      const d = 0.3 + rr() * 0.4;
      const px = Math.round(x + Math.cos(a) * rx * d);
      const py = Math.round(y + Math.sin(a) * ry * d);
      disc(g, "#2f8f46", px, py, 3);
      disc(g, "#52b559", px - 1, py - 1, 2);
      R(g, "#52aaea", px + 1, py, 4, 1);
      if (i % 2 === 0) heartShape(g, "#ff9ec4", px, py - 1, 4);
    }
    for (let i = 0; i < 18; i++) {
      const a = (i / 18) * Math.PI * 2;
      const px = Math.round(x + Math.cos(a) * (rx + 4));
      const py = Math.round(y + Math.sin(a) * (ry + 4));
      disc(g, i % 2 ? "#a29cae" : "#8d879a", px, py, 2);
      R(g, "#d3cddc", px - 1, py - 1, 1, 1);
    }
    for (let i = 0; i < 5; i++) {
      const px = x - rx + 4 + i * 4;
      const py = y + ry - 1 + (i % 2);
      R(g, "#3f9b4a", px, py - 8, 1, 8);
      R(g, "#6a4a2a", px, py - 11, 2, 4);
    }
  }

  // heart flower bed
  {
    const { x, y, size } = s.heartBed;
    heartShape(g, "#3a2418", x, y, size + 4);
    heartShape(g, "#5b3b28", x, y, size);
    const mm = heartMask(size);
    const x0 = Math.round(x - size / 2);
    const y0 = Math.round(y - size / 2);
    const cols = ["#ff3b6b", "#ff6f91", "#ff9bb6", "#ffffff", "#e0245e"];
    for (let py = 1; py < size - 1; py += 3)
      for (let px = 1; px < size - 1; px += 3) {
        const jx = px + Math.floor(rr() * 2);
        const jy = py + Math.floor(rr() * 2);
        if (!mm[Math.min(size - 1, jy) * size + Math.min(size - 1, jx)]) continue;
        R(g, "#2f7d3c", x0 + jx - 1, y0 + jy + 1, 3, 2);
        R(g, cols[Math.floor(rr() * cols.length)], x0 + jx, y0 + jy - 1, 2, 3);
        R(g, "rgba(255,255,255,0.5)", x0 + jx, y0 + jy - 1, 1, 1);
      }
  }

  // picnic blanket
  {
    const { x, y } = s.blanket;
    R(g, "#8a2f4a", x - 18, y - 12, 36, 24);
    for (let j = 0; j < 6; j++)
      for (let i = 0; i < 9; i++) {
        R(g, (i + j) % 2 ? "#ffffff" : "#ff7fa8", x - 17 + i * 4, y - 11 + j * 4, 4, 4);
      }
    R(g, "rgba(0,0,0,0.12)", x - 18, y + 8, 36, 4);
    heartOutlined(g, "#ff3b6b", "#7d1f45", x - 4, y - 1, 9);
    R(g, "#8a5a34", x + 6, y - 6, 9, 7);
    R(g, "#b07a46", x + 6, y - 6, 9, 2);
    R(g, "#5a3a26", x + 7, y - 9, 7, 1);
    R(g, "#5a3a26", x + 7, y - 9, 1, 3);
    R(g, "#5a3a26", x + 13, y - 9, 1, 3);
    R(g, "#d92b45", x + 8, y - 8, 2, 2);
    R(g, "#ffffff", x - 14, y + 3, 4, 4);
    R(g, "#ff7fa8", x - 13, y + 4, 2, 1);
  }

  // fences
  for (const [x1, y1, x2, y2] of s.fences) {
    const horiz = y1 === y2;
    const len = horiz ? x2 - x1 : y2 - y1;
    if (horiz) {
      R(g, "#5a3a26", x1, y1 - 7, len + 3, 2);
      R(g, "#5a3a26", x1, y1 - 3, len + 3, 2);
      R(g, WOODL, x1, y1 - 7, len + 3, 1);
      R(g, WOODL, x1, y1 - 3, len + 3, 1);
    } else {
      R(g, "#5a3a26", x1 - 1, y1 - 7, 2, len + 7);
    }
    for (let p = 0; p <= len; p += 10) {
      const px = horiz ? x1 + p : x1 - 1;
      const py = horiz ? y1 : y1 + p;
      R(g, "#3a2418", px - 1, py - 10, 5, 11);
      R(g, "#d9a96e", px, py - 9, 3, 9);
      R(g, "#f1d19a", px, py - 9, 1, 9);
      R(g, "#d9a96e", px, py - 11, 3, 1);
    }
  }

  // drifting rose petals on the roads
  for (let ty = 0; ty < th; ty++)
    for (let tx = 0; tx < tw; tx++) {
      if (m(tx, ty) && rr() < 0.18) {
        const px = tx * T + Math.floor(rr() * 14);
        const py = ty * T + Math.floor(rr() * 14);
        R(g, rr() < 0.5 ? "#ff8fb7" : "#ffc2d9", px, py, 2, 1);
        R(g, "#e0457a", px + 1, py + 1, 1, 1);
      }
    }
  return c;
}
