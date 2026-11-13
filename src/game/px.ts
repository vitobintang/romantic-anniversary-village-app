// Tiny pixel-art toolkit: every asset in the game is drawn with these helpers.
export type Ctx = CanvasRenderingContext2D;
export type Cvs = HTMLCanvasElement;
type Factory = (w: number, h: number) => Cvs;

let factory: Factory = (w, h) => {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  return c;
};
export function setCanvasFactory(f: Factory) {
  factory = f;
}

export function mk(w: number, h: number): { c: Cvs; g: Ctx } {
  const c = factory(w, h);
  const g = c.getContext("2d") as Ctx;
  g.imageSmoothingEnabled = false;
  return { c, g };
}

export function R(g: Ctx, col: string, x: number, y: number, w: number, h: number) {
  g.fillStyle = col;
  g.fillRect(x, y, w, h);
}

export function disc(g: Ctx, col: string, cx: number, cy: number, r: number) {
  g.fillStyle = col;
  for (let dy = -r; dy <= r; dy++) {
    const w = Math.floor(Math.sqrt(r * r + r * 0.8 - dy * dy));
    g.fillRect(cx - w, cy + dy, w * 2 + 1, 1);
  }
}

export function ell(g: Ctx, col: string, cx: number, cy: number, rx: number, ry: number) {
  g.fillStyle = col;
  for (let dy = -ry; dy <= ry; dy++) {
    const t = 1 - (dy / (ry + 0.5)) ** 2;
    const w = Math.floor(rx * Math.sqrt(Math.max(0, t)) + 0.5);
    g.fillRect(cx - w, cy + dy, w * 2 + 1, 1);
  }
}

export function shade(hex: string, a: number): string {
  const n = parseInt(hex.slice(1), 16);
  let r = n >> 16;
  let gg = (n >> 8) & 255;
  let b = n & 255;
  const t = a < 0 ? 0 : 255;
  const k = Math.abs(a);
  r = Math.round(r + (t - r) * k);
  gg = Math.round(gg + (t - gg) * k);
  b = Math.round(b + (t - b) * k);
  return "#" + ((1 << 24) | (r << 16) | (gg << 8) | b).toString(16).slice(1);
}

export function mulberry32(a: number) {
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function hash(x: number, y: number, s = 0): number {
  let h = Math.imul(x | 0, 374761393) + Math.imul(y | 0, 668265263) + Math.imul(s | 0, 1442695041);
  h = (h ^ (h >>> 13)) >>> 0;
  h = Math.imul(h, 1274126177);
  h = (h ^ (h >>> 16)) >>> 0;
  return h / 4294967296;
}

export function pmap(g: Ctx, rows: string[], pal: Record<string, string>, x: number, y: number, flip = false) {
  for (let j = 0; j < rows.length; j++) {
    const r = rows[j];
    for (let i = 0; i < r.length; i++) {
      const ch = r[flip ? r.length - 1 - i : i];
      const col = pal[ch];
      if (!col) continue;
      g.fillStyle = col;
      g.fillRect(x + i, y + j, 1, 1);
    }
  }
}

const hm = new Map<number, boolean[]>();
export function heartMask(size: number): boolean[] {
  let m = hm.get(size);
  if (m) return m;
  m = [];
  for (let py = 0; py < size; py++) {
    for (let px = 0; px < size; px++) {
      const u = ((px + 0.5) / size * 2 - 1) * 1.2;
      const v = 1.3 - ((py + 0.5) / size) * 2.4;
      const a = u * u + v * v - 1;
      m.push(a * a * a - u * u * v * v * v <= 0);
    }
  }
  hm.set(size, m);
  return m;
}

export function heartShape(g: Ctx, col: string, cx: number, cy: number, size: number) {
  const m = heartMask(size);
  const x0 = Math.round(cx - size / 2);
  const y0 = Math.round(cy - size / 2);
  g.fillStyle = col;
  for (let py = 0; py < size; py++) {
    let start = -1;
    for (let px = 0; px <= size; px++) {
      const on = px < size && m[py * size + px];
      if (on && start < 0) start = px;
      if (!on && start >= 0) {
        g.fillRect(x0 + start, y0 + py, px - start, 1);
        start = -1;
      }
    }
  }
}

export function heartOutlined(g: Ctx, fill: string, line: string, cx: number, cy: number, size: number) {
  heartShape(g, line, cx, cy, size + 2);
  heartShape(g, fill, cx, cy, size);
  if (size >= 7) {
    R(g, "rgba(255,255,255,0.75)", Math.round(cx - size * 0.28), Math.round(cy - size * 0.28), 2, 1);
    R(g, "rgba(255,255,255,0.5)", Math.round(cx - size * 0.34), Math.round(cy - size * 0.18), 1, 1);
  }
}

export function outlined(src: Cvs, col: string): Cvs {
  const w = src.width + 2;
  const h = src.height + 2;
  const { c, g } = mk(w, h);
  const offs = [
    [0, 1],
    [2, 1],
    [1, 0],
    [1, 2],
  ];
  for (const [dx, dy] of offs) g.drawImage(src, dx, dy);
  g.globalCompositeOperation = "source-in";
  g.fillStyle = col;
  g.fillRect(0, 0, w, h);
  g.globalCompositeOperation = "source-over";
  g.drawImage(src, 1, 1);
  return c;
}

export interface Sprite {
  c: Cvs;
  ax: number;
  ay: number;
}

export function finish(c: Cvs, ax: number, ay: number, line = "#2f2438"): Sprite {
  return { c: outlined(c, line), ax: ax + 1, ay: ay + 1 };
}

export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
export const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));
