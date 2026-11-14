import { mk, R, shade, outlined, pmap, disc, ell, Cvs, Ctx } from "./px";

export type Dir = 0 | 1 | 2 | 3; // down, up, left, right
export type Acc =
  | "none"
  | "crown"
  | "straw"
  | "helmet"
  | "chef"
  | "bonnet"
  | "feather"
  | "flowers"
  | "bandana"
  | "cap"
  | "hardhat";

export interface Look {
  id: string;
  skin: string;
  hair: string;
  style: "short" | "long" | "bun" | "pony" | "bald" | "curly";
  top: string;
  bottom: string;
  dress?: boolean;
  acc?: Acc;
  accCol?: string;
  beard?: string;
  apron?: string;
  stripe?: string;
  armor?: boolean;
  scale?: number;
  shoes?: string;
}

export const CH_AX = 12;
export const CH_AY = 30;
const INK = "#2b1b2e";
const cache = new Map<string, Cvs>();

function build(look: Look, dir: 0 | 1 | 2, leg: number, armL: number, armR: number): Cvs {
  const { c, g } = mk(22, 34);
  g.translate(1, 3);
  const r = (col: string, x: number, y: number, w: number, h: number) => R(g, col, x, y, w, h);
  const sk = look.skin;
  const skD = shade(sk, -0.16);
  const hair = look.hair;
  const hairD = shade(hair, -0.28);
  const hairL = shade(hair, 0.25);
  const top = look.top;
  const topD = shade(top, -0.22);
  const topL = shade(top, 0.2);
  const bot = look.bottom;
  const botD = shade(bot, -0.22);
  const shoe = look.shoes ?? "#5a3a2c";
  const front = dir === 0;
  const back = dir === 1;
  const side = dir === 2;
  const long = look.style === "long";
  const L1 = leg === 1;
  const L2 = leg === 2;
  const sleeve = look.armor ? "#a9b8cf" : top;

  if (front && long) {
    r(hair, 4, 5, 12, 12);
    r(hairD, 4, 15, 12, 2);
  }

  // legs
  const legCol = look.dress ? "#f6e9ea" : bot;
  if (!side) {
    const a = L1 ? 1 : 0;
    const b = L2 ? 1 : 0;
    r(legCol, 6, 19, 3, 5 - a);
    r(shoe, 6, 24 - a, 3, 2);
    r(legCol, 11, 19, 3, 5 - b);
    r(shoe, 11, 24 - b, 3, 2);
  } else {
    const fx = L1 ? 6 : L2 ? 8 : 7;
    const bx = L1 ? 11 : L2 ? 9 : 10;
    const fl = L2 ? 1 : 0;
    const bl = L1 ? 1 : 0;
    r(shade(legCol, -0.15), bx, 19, 3, 5 - bl);
    r(shade(shoe, -0.15), bx, 24 - bl, 3, 2);
    r(legCol, fx, 19, 3, 5 - fl);
    r(shoe, fx - 1, 24 - fl, 4, 2);
  }

  // torso
  if (!side) {
    r(top, 6, 13, 8, 7);
    r(topL, 6, 13, 8, 1);
    r(topD, 6, 19, 8, 1);
    r(topD, 13, 14, 1, 5);
    if (look.armor) {
      r(shade(top, 0.28), 7, 14, 6, 3);
      r("#d9b44a", 6, 18, 8, 1);
      r("#d9b44a", 9, 14, 2, 1);
    }
    if (look.stripe && !look.dress) r(look.stripe, 9, 13, 2, look.armor ? 5 : 10);
    if (look.stripe && look.dress) r(look.stripe, 6, 17, 8, 1);
  } else {
    r(top, 7, 13, 6, 7);
    r(topL, 7, 13, 6, 1);
    r(topD, 7, 19, 6, 1);
    r(topD, 12, 14, 1, 5);
    if (look.armor) r("#d9b44a", 7, 18, 6, 1);
  }
  if (look.dress) {
    const widths = side ? [6, 8, 8, 10, 10] : [8, 10, 10, 12, 14];
    const sw = leg === 1 ? 1 : leg === 2 ? -1 : 0;
    for (let i = 0; i < widths.length; i++) {
      const w = widths[i];
      let x0 = Math.round(10 - w / 2) + (i === widths.length - 1 ? sw : 0);
      if (side) x0 = Math.round(9.5 - w / 2) + (i === widths.length - 1 ? sw : 0);
      r(bot, x0, 18 + i, w, 1);
      r(botD, x0 + w - 2, 18 + i, 2, 1);
      if (i === widths.length - 1) r(shade(bot, 0.3), x0, 18 + i, w, 1);
    }
  }
  if (look.apron && !back) {
    if (side) {
      r(look.apron, 6, 15, 3, 7);
    } else {
      r(look.apron, 7, 15, 6, 7);
      r(shade(look.apron, -0.14), 7, 21, 6, 1);
      r(shade(look.apron, -0.1), 6, 14, 1, 2);
      r(shade(look.apron, -0.1), 13, 14, 1, 2);
    }
  }

  // arms
  const arm = (x: number, pose: number, right: boolean) => {
    if (pose === 2) {
      const ax = right ? x + 1 : x - 1;
      r(sleeve, ax, 6, 2, 7);
      r(sk, ax, 4, 2, 2);
    } else {
      const dy = pose === 1 ? -1 : pose === 3 ? 1 : 0;
      r(sleeve, x, 14 + dy, 2, 4);
      r(sk, x, 18 + dy, 2, 2);
    }
  };
  if (!side) {
    arm(4, armL, false);
    arm(14, armR, true);
  } else {
    if (armL === 2) {
      r(sleeve, 5, 6, 2, 7);
      r(sk, 4, 4, 2, 2);
    } else {
      const ox = armL === 1 ? -2 : armL === 3 ? 2 : 0;
      r(sleeve, 8 + ox, 14, 2, 4);
      r(sk, 8 + ox, 18, 2, 2);
    }
  }

  // long hair draped over the back for back/side views
  if (back && long) {
    r(hair, 4, 3, 12, 15);
    r(hairD, 4, 16, 12, 2);
    r(hairL, 8, 5, 2, 9);
  }
  if (side && long) {
    r(hair, 11, 5, 4, 13);
    r(hairD, 11, 16, 4, 2);
  }

  // head
  r(sk, 6, 3, 8, 1);
  r(sk, 5, 4, 10, 8);
  r(skD, 6, 12, 8, 1);
  if (!side) r(skD, 14, 6, 1, 5);

  // face
  if (front) {
    if (look.beard) {
      r(look.beard, 5, 9, 2, 3);
      r(look.beard, 13, 9, 2, 3);
      r(look.beard, 6, 11, 8, 2);
      r(look.beard, 8, 10, 4, 1);
    }
    r(INK, 6, 8, 2, 3);
    r(INK, 12, 8, 2, 3);
    r("#ffffff", 7, 8, 1, 1);
    r("#ffffff", 13, 8, 1, 1);
    r("rgba(255,110,140,0.5)", 5, 10, 2, 1);
    r("rgba(255,110,140,0.5)", 13, 10, 2, 1);
    r(look.beard ? "#8a3b3b" : "#c0504e", 9, 11, 2, 1);
  } else if (side) {
    if (look.beard) {
      r(look.beard, 5, 10, 5, 3);
      r(look.beard, 9, 9, 4, 3);
    }
    r(INK, 6, 8, 2, 3);
    r("#ffffff", 6, 8, 1, 1);
    r(sk, 4, 9, 1, 2);
    r("rgba(255,110,140,0.5)", 8, 10, 2, 1);
    r(look.beard ? "#8a3b3b" : "#c0504e", 5, 11, 1, 1);
  }

  // hair
  const st = look.style;
  if (st !== "bald") {
    if (front) {
      if (st === "curly") {
        r(hair, 5, 1, 10, 1);
        r(hair, 4, 2, 12, 4);
        r(hair, 3, 4, 1, 5);
        r(hair, 16, 4, 1, 5);
        r(hairL, 6, 2, 2, 1);
        r(hairL, 11, 2, 2, 1);
      } else {
        r(hair, 6, 2, 8, 1);
        r(hair, 5, 3, 10, 3);
        r(hair, 4, 4, 1, 6);
        r(hair, 15, 4, 1, 6);
        r(hairL, 7, 3, 4, 1);
        r(hairD, 5, 5, 10, 1);
      }
      r(hair, 5, 6, 3, 1);
      r(hair, 12, 6, 3, 1);
      r(hair, 9, 6, 2, 1);
      if (st === "pony") {
        r(hair, 16, 6, 2, 7);
        r(hairD, 16, 11, 2, 2);
        r("#ff6b8b", 15, 6, 2, 1);
      }
    } else if (back) {
      r(hair, 6, 1, 8, 1);
      r(hair, 5, 2, 10, 10);
      r(hair, 4, 3, 1, 7);
      r(hair, 15, 3, 1, 7);
      r(hairL, 7, 2, 4, 1);
      r(hairD, 5, 10, 10, 2);
      if (st === "pony") {
        r(hair, 9, 10, 2, 8);
        r("#ff6b8b", 9, 10, 2, 1);
      }
    } else {
      r(hair, 6, 2, 8, 1);
      r(hair, 5, 3, 10, 3);
      r(hair, 10, 6, 5, 6);
      r(hair, 15, 5, 1, 5);
      r(hair, 5, 6, 3, 1);
      r(hairL, 7, 3, 4, 1);
      r(hairD, 10, 6, 1, 6);
      if (st === "pony") {
        r(hair, 15, 6, 3, 2);
        r(hair, 16, 8, 2, 6);
        r("#ff6b8b", 15, 6, 1, 2);
      }
    }
    if (st === "bun") {
      const bx = side ? 12 : 10;
      r(hair, bx - 2, -1, 4, 3);
      r(hair, bx - 3, 0, 6, 2);
      r(hairL, bx - 1, -1, 2, 1);
      r("#ff6b8b", bx - 3, 2, 6, 1);
    }
  }

  // accessories
  const acc = look.acc ?? "none";
  const ac = look.accCol ?? "#c0392b";
  if (acc === "crown") {
    r("#f7c948", 6, 1, 8, 2);
    r("#f7c948", 6, 0, 1, 1);
    r("#f7c948", 9, -1, 2, 2);
    r("#f7c948", 13, 0, 1, 1);
    r("#fff2a8", 6, 1, 8, 1);
    r("#ff4d6d", 9, 1, 2, 1);
    r("#c9962b", 6, 2, 8, 1);
  } else if (acc === "straw") {
    r("#e8c36a", 2, 3, 16, 2);
    r("#c9a24c", 3, 5, 14, 1);
    r("#e8c36a", 5, 0, 10, 3);
    r("#f5dc94", 6, 0, 5, 1);
    r(ac, 5, 2, 10, 1);
  } else if (acc === "helmet") {
    r("#aab6c8", 4, 1, 12, 6);
    r("#d2dcea", 5, 1, 6, 2);
    r("#7d8aa0", 4, 6, 12, 1);
    if (front) {
      r("#7d8aa0", 4, 7, 2, 4);
      r("#7d8aa0", 14, 7, 2, 4);
      r("#8e9bb2", 9, 5, 2, 4);
    }
    r("#e0384f", 9, -2, 2, 3);
  } else if (acc === "chef") {
    r("#ffffff", 6, -3, 8, 2);
    r("#ffffff", 5, -1, 10, 3);
    r("#ffffff", 5, 2, 10, 2);
    r("#e2dcdc", 5, 3, 10, 1);
    r("#e2dcdc", 11, -2, 2, 3);
  } else if (acc === "bonnet") {
    r(ac, 5, 2, 10, 4);
    r(shade(ac, 0.25), 6, 2, 4, 1);
    r("#ffffff", 4, 5, 12, 1);
    r("#ff9ec4", 9, 1, 2, 1);
  } else if (acc === "feather") {
    r(ac, 5, 1, 10, 4);
    r(shade(ac, 0.25), 6, 1, 5, 1);
    if (front) r(shade(ac, -0.2), 4, 4, 12, 1);
    r("#ffffff", 13, -4, 1, 5);
    r("#ffe0ec", 14, -3, 1, 3);
    r("#ff6b8b", 13, -5, 1, 1);
  } else if (acc === "flowers") {
    r("#ff7fa8", 5, 2, 2, 2);
    r("#ffffff", 8, 1, 2, 2);
    r("#ffd84d", 11, 1, 2, 2);
    r("#ff7fa8", 13, 2, 2, 2);
    r("#4caf50", 7, 3, 1, 1);
    r("#4caf50", 12, 3, 1, 1);
  } else if (acc === "bandana") {
    r(ac, 5, 3, 10, 2);
    r(shade(ac, -0.2), 5, 5, 10, 1);
    r(ac, 14, 4, 2, 3);
  } else if (acc === "cap") {
    r(ac, 5, 1, 10, 3);
    r(shade(ac, 0.25), 6, 1, 4, 1);
    if (front) r(shade(ac, -0.25), 4, 4, 12, 1);
    if (side) r(shade(ac, -0.25), 3, 4, 5, 1);
  } else if (acc === "hardhat") {
    r("#ffd23f", 5, 1, 10, 4);
    r("#fff0a0", 6, 1, 5, 1);
    r("#e0a800", 4, 4, 12, 1);
    r("#e0a800", 9, 0, 2, 1);
  }

  return outlined(c, INK);
}

export function charSprite(look: Look, dir: 0 | 1 | 2, leg: number, armL: number, armR: number): Cvs {
  const key = `${look.id}|${dir}|${leg}|${armL}|${armR}`;
  let s = cache.get(key);
  if (!s) {
    s = build(look, dir, leg, armL, armR);
    cache.set(key, s);
  }
  return s;
}

export interface DrawOpt {
  sx?: number;
  sy?: number;
  alpha?: number;
}

export function drawChar(
  g: Ctx,
  look: Look,
  x: number,
  y: number,
  dir: Dir,
  leg: number,
  armL: number,
  armR: number,
  opt?: DrawOpt,
) {
  const spr = charSprite(look, dir === 3 ? 2 : dir, leg, armL, armR);
  const s = look.scale ?? 1;
  g.save();
  g.translate(Math.round(x), Math.round(y));
  const sx = (opt?.sx ?? 1) * s;
  const sy = (opt?.sy ?? 1) * s;
  g.scale(dir === 3 ? -sx : sx, sy);
  if (opt?.alpha !== undefined) g.globalAlpha = opt.alpha;
  g.drawImage(spr, -CH_AX, -CH_AY);
  g.restore();
}

// ---------- animals ----------
const spriteCache = new Map<string, Cvs>();
function memo(key: string, w: number, h: number, fn: (g: Ctx) => void, line = INK): Cvs {
  let c = spriteCache.get(key);
  if (!c) {
    const m = mk(w, h);
    fn(m.g);
    c = outlined(m.c, line);
    spriteCache.set(key, c);
  }
  return c;
}

const CHICKEN = [
  "..rr......",
  ".rwwww....",
  "ykwwwww...",
  "yrwwwwwww.",
  ".wwwwwwwwW",
  ".wwwwwwwWW",
  "..wwwwWW..",
];

export function chickenSprite(brown: boolean, step: number): Cvs {
  return memo(`chick${brown}${step}`, 10, 10, (g) => {
    const body = brown ? "#b86a3c" : "#fffaf0";
    const sh = brown ? "#8e4a28" : "#d8cfc0";
    pmap(g, CHICKEN, { r: "#e8344a", w: body, W: sh, y: "#ffb02e", k: "#2b1b2e" }, 0, 0);
    if (brown) pmap(g, ["...", ".w."], { w: "#d99060" }, 3, 3);
    const lx = step ? [3, 6] : [4, 5];
    R(g, "#ffb02e", lx[0], 7, 1, 2);
    R(g, "#ffb02e", lx[1], 7, 1, 2);
  });
}

export type CatBody = "fat" | "slim";

export interface CatLook {
  body: CatBody;
  size?: "adult" | "kitten";
  /** main coat */
  fur: string;
  /** second colour: patches, blaze, plume tip */
  patch: string;
  /** optional third colour (grey on a white cat, etc.) */
  patch2?: string;
  /** muzzle, chest and paws */
  belly: string;
  eye: string;
}

/**
 * The village cats. `body: "fat"` gives a round, flat-faced, plume-tailed
 * Persian; `"slim"` gives a narrow, pointy-eared street cat. Kittens reuse
 * the same shapes at a smaller scale.
 */
export function catSprite(look: CatLook, frame = 0): Cvs {
  const fat = look.body === "fat";
  const k = look.size === "kitten" ? 0.6 : 1;
  const bw = fat ? 27 : 18;
  const bh = fat ? 22 : 18;
  const w = Math.max(9, Math.round(bw * k));
  const h = Math.max(9, Math.round(bh * k));
  const key = `cat:${look.body}:${look.size ?? "adult"}:${look.fur}:${look.patch}:${look.patch2 ?? ""}:${frame}`;

  return memo(key, w, h, (g) => {
    const F = look.fur;
    const D = shade(F, -0.24);
    const P = look.patch;
    const P2 = look.patch2 ?? P;
    const M = look.belly;
    const E = look.eye;

    const sx = (v: number) => Math.round(v * k);
    const sy = (v: number) => Math.round(v * k);
    const blob = (cx: number, cy: number, rx: number, ry: number, col: string) =>
      ell(g, col, sx(cx), sy(cy), Math.max(1, sx(rx)), Math.max(1, sy(ry)));
    const rect = (col: string, x: number, y: number, rw: number, rh: number) =>
      R(g, col, sx(x), sy(y), Math.max(1, sx(rw)), Math.max(1, sy(rh)));

    const bob = frame;
    const pink = "#ee8fae";

    if (fat) {
      // --- fluffy plume tail, curling up on the right -----------------
      rect(D, 18.2, 13.4, 3.8, 2.8);
      blob(21, 12 + bob, 2.6, 2.6, D);
      blob(22, 9.6 + bob, 2.2, 2.4, F);
      blob(22.6, 7.8 + bob, 1.6, 1.6, F);
      blob(22.8, 6.9 + bob, 1, 1, P);

      // --- wide, sitting body ------------------------------------------
      blob(13, 14.4, 9, 5.4, D);
      blob(13, 13.6, 8.2, 4.6, F);
      // fluff tufts breaking up the silhouette
      blob(4.8, 16.6, 2.2, 1.8, F);
      blob(20.2, 16.8, 2.2, 1.6, F);
      blob(21.4, 12.4, 2, 2, F);
      // markings on the back
      blob(17.6, 11.8, 3, 2.2, P2);
      // white bib under the chin (small, so the body stays its own colour)
      blob(8.2, 16.4, 3.6, 2.2, M);

      // --- big round head, sitting on the body -------------------------
      blob(8, 7.6 + bob, 6.4, 5.4, D);
      blob(8, 7 + bob, 5.8, 4.8, F);
      // flat, tufted Persian ears
      rect(D, 2.2, 2.2 + bob, 2.8, 3);
      rect(F, 2.7, 2.6 + bob, 1.6, 2);
      rect(D, 9.8, 2.2 + bob, 2.8, 3);
      rect(F, 10.3, 2.6 + bob, 1.6, 2);
      rect(pink, 3.1, 2.8 + bob, 1, 1);
      rect(pink, 10.7, 2.8 + bob, 1, 1);
      // blaze down the forehead
      blob(8, 4.4 + bob, 2.2, 1.3, P2);
      // muzzle
      blob(8, 10 + bob, 3.4, 2, M);
      // eyes: round, with an iris, a pupil and a glint
      blob(5.2, 6.9 + bob, 1.9, 1.9, "#fffdf6");
      blob(10.8, 6.9 + bob, 1.9, 1.9, "#fffdf6");
      blob(5.4, 7.1 + bob, 0.9, 1.1, E);
      blob(10.6, 7.1 + bob, 0.9, 1.1, E);
      rect("#2b1b2e", 5, 7 + bob, 1, 1);
      rect("#2b1b2e", 10, 7 + bob, 1, 1);
      rect("#ffffff", 4.4, 6.2 + bob, 1, 1);
      rect("#ffffff", 10, 6.2 + bob, 1, 1);
      // nose + little mouth
      rect(pink, 7.5, 9.1 + bob, 1.5, 1);
      rect(D, 7.2, 10.2 + bob, 1, 1);
      rect(D, 8.8, 10.2 + bob, 1, 1);
      // whisker freckles
      rect(D, 4.4, 9.6 + bob, 1, 1);
      rect(D, 11.6, 9.6 + bob, 1, 1);

      // --- front paws ---------------------------------------------------
      blob(6.6, 19.4, 2.4, 1.4, M);
      blob(12.6, 19.4, 2.6, 1.4, M);
      rect(D, 5.6, 20, 1, 1);
      rect(D, 8, 20, 1, 1);
      rect(D, 11.6, 20, 1, 1);
    } else {
      // --- slim tail ----------------------------------------------------
      rect(F, 14, 9 + bob, 2, 1);
      rect(D, 15.6, 6.6 + bob, 1.2, 3.4);
      blob(16, 6 + bob, 1.2, 1.4, P);

      // --- narrow body ---------------------------------------------------
      blob(8, 12.4, 5, 4.6, D);
      blob(8, 11.8, 4.4, 4, F);
      blob(8, 13.6, 2.4, 2.4, M); // chest
      rect(D, 6.4, 9.6 + bob, 3, 1);
      rect(D, 6.4, 11.4 + bob, 2.4, 1);

      // --- head ----------------------------------------------------------
      blob(6, 5.6 + bob, 4.8, 4.4, D);
      blob(6, 5.1 + bob, 4.2, 3.8, F);
      // pointy ears
      rect(D, 1.8, 1.2 + bob, 1.8, 2.8);
      rect(F, 2.2, 1.6 + bob, 1, 2);
      rect(D, 8.4, 1.2 + bob, 1.8, 2.8);
      rect(F, 8.8, 1.6 + bob, 1, 2);
      // muzzle
      blob(6, 7.3 + bob, 2.8, 1.9, M);
      blob(9.4, 8.6 + bob, 1.8, 1.4, P);
      // eyes
      blob(4.2, 5 + bob, 1.5, 1.5, "#fffdf6");
      blob(7.8, 5 + bob, 1.5, 1.5, "#fffdf6");
      blob(4.3, 5.2 + bob, 0.8, 0.9, E);
      blob(7.7, 5.2 + bob, 0.8, 0.9, E);
      rect("#ffffff", 3.6, 4.4 + bob, 1, 1);
      rect("#ffffff", 7.2, 4.4 + bob, 1, 1);
      // nose
      rect(pink, 5.6, 6.4 + bob, 1.2, 1);

      // --- legs -----------------------------------------------------------
      rect(F, 5, 14.6, 1.6, 2.8);
      rect(D, 5, 16.4, 1.6, 1.2);
      rect(F, 9.4, 14.6, 1.6, 2.8);
      rect(D, 9.4, 16.4, 1.6, 1.2);
      // paw tips
      rect(M, 5, 17, 1.6, 1);
      rect(M, 9.4, 17, 1.6, 1);
    }
  });
}

export function doveSprite(frame: number): Cvs {
  return memo(`dove${frame}`, 9, 7, (g) => {
    const up = [".w...w.", "ww...ww", ".wwwww.", "..wwk..", "...y..."];
    const dn = ["...w...", "..wwk..", ".wwwww.", "ww...ww", "w.....w"];
    pmap(g, frame ? up : dn, { w: "#ffffff", k: "#2b1b2e", y: "#ffb02e" }, 1, 1);
    R(g, "#e6dfe9", 3, 3, 3, 1);
  }, "#8e7aa0");
}

export function giftBoxSprite(): Cvs {
  return memo("gift", 16, 16, (g) => {
    R(g, "#ff6b9a", 1, 5, 14, 9);
    R(g, "#ff8fb7", 1, 5, 14, 2);
    R(g, "#e04a7e", 1, 12, 14, 2);
    R(g, "#ffd84d", 7, 5, 2, 9);
    R(g, "#ffd84d", 1, 8, 14, 1);
    R(g, "#ff4d78", 0, 3, 16, 3);
    R(g, "#ffd84d", 6, 1, 4, 2);
    disc(g, "#ffd84d", 5, 2, 1);
    disc(g, "#ffd84d", 11, 2, 1);
  });
}
