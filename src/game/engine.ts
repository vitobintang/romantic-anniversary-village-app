import { buildWorld, World, WW, WH, PEN, HouseInst } from "./world";
import { NPCS, NpcDef, PRINCESS_LOOK, PLAYER_START, Reaction, Topic, MEMORIES, CATS, CatDef } from "./config";
import { drawChar, Dir, chickenSprite, catSprite, CatCoat, doveSprite, giftBoxSprite } from "./sprites";
import { clamp } from "./px";
import * as sfx from "./audio";

export type Phase = "title" | "intro" | "zoomout" | "play";

export interface DialogView {
  /** villagers show their character portrait, cats their little sprite */
  kind: "npc" | "cat";
  npcId: string;
  /** cat coat, so the portrait matches the cat in the world */
  coat?: CatCoat;
  name: string;
  title: string;
  text: string;
  choices: { label: string; seen: boolean }[] | null;
  voice: number;
  key: number;
  apology: boolean;
}
export interface UiState {
  phase: Phase;
  dialog: DialogView | null;
  near: { kind: "house" | "fountain" | "cat"; label: string } | null;
  opened: string[];
  total: number;
  photo: string | null;
  finale: boolean;
  toast: { text: string; id: number } | null;
}

interface Line {
  text?: string;
  react?: Reaction;
  menu?: boolean;
}
interface Anim {
  type: Reaction;
  t: number;
  dur: number;
  em: number;
  em2: number;
}
interface Npc {
  def: NpcDef;
  x: number;
  y: number;
  dir: Dir;
  walk: number;
  moving: boolean;
  tx: number | null;
  ty: number | null;
  wait: number;
  stuck: number;
  cooldown: number;
  routeIdx: number;
  anim: Anim | null;
  jobT: number;
}
interface Cat {
  def: CatDef;
  x: number;
  y: number;
  homeX: number;
  homeY: number;
  dir: number;
  step: number;
  tx: number | null;
  ty: number | null;
  wait: number;
  purr: number;
}

/** a cat conversation — same dialogue box as the villagers, all meows */
interface CatDialog {
  cat: Cat;
  queue: string[];
  text: string;
  key: number;
}
interface Animal {
  kind: "chicken" | "cat";
  x: number;
  y: number;
  dir: number;
  tx: number | null;
  ty: number | null;
  wait: number;
  step: number;
  brown: boolean;
}
type PK = "heart" | "spark" | "tear" | "sweat" | "note" | "excl" | "smoke" | "confetti" | "drop";
interface Particle {
  k: PK;
  x: number;
  y: number;
  vx: number;
  vy: number;
  g: number;
  t: number;
  life: number;
  size: number;
  col: string;
}

const DUR: Record<Reaction, number> = {
  jump: 1.2,
  spin: 1.3,
  bow: 1.5,
  blush: 2.0,
  dance: 2.4,
  shake: 1.4,
  cry: 2.4,
  salute: 1.6,
  wave: 1.8,
  gasp: 1.0,
  laugh: 1.6,
  cheer: 2.0,
};

const FACE: Dir[] = [0, 2, 1, 3];
const LEG = [1, 0, 2, 0];

function dirOf(dx: number, dy: number): Dir {
  return Math.abs(dx) > Math.abs(dy) ? (dx < 0 ? 2 : 3) : dy < 0 ? 1 : 0;
}
function pick<T>(a: T[]): T {
  return a[Math.floor(Math.random() * a.length)];
}

export class Game {
  private canvas: HTMLCanvasElement;
  private g: CanvasRenderingContext2D;
  private cb: (s: UiState) => void;
  private world: World;
  private w = 0;
  private h = 0;
  private dpr = 1;
  private raf = 0;
  private last = 0;
  private time = 0;
  private phase: Phase = "title";
  private introT = 0;
  private cam = { x: 448, y: 380, zoom: 2, fy: 0.5 };
  private player = { x: PLAYER_START.x, y: PLAYER_START.y, dir: 1 as Dir, walk: 0, moving: false };
  private npcs: Npc[] = [];
  private animals: Animal[] = [];
  private cats: Cat[] = [];
  private parts: Particle[] = [];
  private petals: { x: number; y: number; s: number; sp: number; ph: number; c: string }[] = [];
  private keys = new Set<string>();
  private joy = { id: -1, active: false, ox: 0, oy: 0, vx: 0, vy: 0, sx: 0, sy: 0, st: 0 };
  private tap: { x: number; y: number; t: number; stuck: number } | null = null;
  private dlg: { npc: Npc; queue: Line[]; seen: Set<number>; intro: boolean; choosing: boolean; text: string; key: number } | null = null;
  private catDlg: CatDialog | null = null;
  private ui: UiState;
  private vignette: CanvasGradient | null = null;
  private smokeT = 0;
  private fountT = 0;
  private toastId = 0;
  private hinted = false;
  private nearKey = "";
  private vw = 0;

  constructor(canvas: HTMLCanvasElement, cb: (s: UiState) => void) {
    this.canvas = canvas;
    this.g = canvas.getContext("2d")!;
    this.cb = cb;
    this.world = buildWorld();
    this.ui = { phase: "title", dialog: null, near: null, opened: [], total: MEMORIES.length, photo: null, finale: false, toast: null };
    for (const d of NPCS) {
      this.npcs.push({
        def: d,
        x: d.x,
        y: d.y,
        dir: d.facing ?? 0,
        walk: 0,
        moving: false,
        tx: null,
        ty: null,
        wait: 1 + Math.random() * 3,
        stuck: 0,
        cooldown: 0,
        routeIdx: 1,
        anim: null,
        jobT: 0,
      });
    }
    const ch: [number, number, boolean][] = [
      [80, 245, false],
      [100, 256, true],
      [76, 262, false],
      [112, 240, true],
    ];
    for (const [x, y, b] of ch) this.animals.push({ kind: "chicken", x, y, dir: 2, tx: null, ty: null, wait: Math.random() * 2, step: 0, brown: b });
    for (const def of CATS) {
      this.cats.push({
        def,
        x: def.x,
        y: def.y,
        homeX: def.x,
        homeY: def.y,
        dir: 2,
        step: 0,
        tx: null,
        ty: null,
        wait: Math.random() * 2,
        purr: Math.random() * 2,
      });
    }
    for (let i = 0; i < 34; i++)
      this.petals.push({ x: Math.random(), y: Math.random(), s: 1.5 + Math.random() * 2, sp: 0.03 + Math.random() * 0.05, ph: Math.random() * 6, c: pick(["#ffb3cf", "#ff8fb7", "#ffd1e3", "#ffffff"]) });
    this.resize();
    this.cam.zoom = Math.max(this.roamZoom() * 0.85, 1.6);
    this.attach();
    this.last = performance.now();
    this.raf = requestAnimationFrame(this.loop);
  }

  // ------------------------------------------------------------ public API
  start() {
    if (this.phase !== "title") return;
    this.phase = "intro";
    this.introT = 0;
    const pip = this.npcs[0];
    pip.x = NPCS[0].x;
    pip.y = NPCS[0].y;
    pip.dir = 0;
    this.player.x = PLAYER_START.x;
    this.player.y = PLAYER_START.y;
    this.player.dir = 1;
    this.react(pip, "wave");
    this.publish();
  }

  next() {
    if (this.catDlg) {
      this.advanceCat();
      return;
    }
    if (!this.dlg || this.dlg.choosing) return;
    this.advance();
  }

  choose(i: number) {
    const d = this.dlg;
    if (!d || !d.choosing) return;
    const topics = d.npc.def.topics;
    if (i < topics.length) {
      const tp: Topic = topics[i];
      d.seen.add(i);
      d.queue = tp.reply.map((text, k) => ({ text, react: k === 0 ? tp.react : undefined }));
      d.queue.push({ menu: true });
    } else {
      d.queue = [{ text: d.npc.def.farewell, react: "wave" }];
    }
    d.choosing = false;
    this.advance();
  }

  interact() {
    if (this.modal() || this.phase !== "play") return;
    const n = this.findNear();
    if (!n) return;
    if (n.kind === "house" && n.house?.memory) {
      const id = n.house.memory.id;
      if (!this.ui.opened.includes(id)) {
        this.ui.opened = [...this.ui.opened, id];
      }
      this.ui.photo = id;
      sfx.chime();
      for (let i = 0; i < 14; i++) this.emit("heart", n.house.x + (Math.random() - 0.5) * 30, n.house.y - 20, (Math.random() - 0.5) * 30, -20 - Math.random() * 30, 1.6, 0, pick(["red", "pink", "gold"]), -4);
      this.publish();
    } else if (n.kind === "cat" && n.cat) {
      this.startCatDialog(n.cat);
    } else if (n.kind === "fountain") {
      if (this.ui.opened.length >= this.ui.total) {
        this.ui.finale = true;
        sfx.sparkleSfx();
        this.publish();
      } else {
        this.toast(`The fountain glimmers softly... find all the memories first (${this.ui.opened.length}/${this.ui.total}) 💞`);
      }
    }
  }

  closePhoto() {
    this.ui.photo = null;
    if (this.ui.opened.length >= this.ui.total && !this.hinted) {
      this.hinted = true;
      this.toast("All memories found! Visit the Heart Fountain in the plaza ✨");
    }
    this.publish();
  }

  closeFinale() {
    this.ui.finale = false;
    this.publish();
  }

  destroy() {
    cancelAnimationFrame(this.raf);
    window.removeEventListener("resize", this.onResize);
    window.removeEventListener("keydown", this.onKey);
    window.removeEventListener("keyup", this.onKeyUp);
    this.canvas.removeEventListener("pointerdown", this.onDown);
    window.removeEventListener("pointermove", this.onMove);
    window.removeEventListener("pointerup", this.onUp);
    window.removeEventListener("pointercancel", this.onUp);
  }

  // ------------------------------------------------------------ internals
  private modal() {
    return !!this.dlg || !!this.catDlg || !!this.ui.photo || this.ui.finale;
  }
  private publish() {
    this.ui.phase = this.phase;
    this.ui.dialog = this.dlg ? this.dialogView() : this.catDlg ? this.catDialogView() : null;
    this.cb({ ...this.ui });
  }
  private toast(text: string) {
    this.ui.toast = { text, id: ++this.toastId };
    this.publish();
  }
  private dialogView(): DialogView {
    const d = this.dlg!;
    const def = d.npc.def;
    return {
      kind: "npc",
      npcId: def.id,
      name: def.name,
      title: def.title,
      text: d.text,
      choices: d.choosing ? [...def.topics.map((t, i) => ({ label: t.label, seen: d.seen.has(i) })), { label: def.exit ?? "Goodbye! 👋", seen: false }] : null,
      voice: def.voice,
      key: d.key,
      apology: !!def.decorator,
    };
  }

  private catDialogView(): DialogView {
    const d = this.catDlg!;
    const def = d.cat.def;
    return {
      kind: "cat",
      npcId: def.id,
      coat: d.cat.def.coat,
      name: def.name,
      title: def.title,
      text: d.text,
      choices: null,
      voice: 640,
      key: d.key,
      apology: false,
    };
  }

  /** cats get the very same dialogue box the villagers use */
  private startCatDialog(c: Cat) {
    const cries = [...c.def.cries];
    const queue = [cries[0], cries[1] ?? cries[0]];
    c.dir = c.x > this.player.x ? 2 : 3;
    this.player.dir = dirOf(c.x - this.player.x, c.y - this.player.y);
    this.player.moving = false;
    this.tap = null;
    this.catDlg = { cat: c, queue, text: "", key: 0 };
    sfx.blip(640);
    for (let i = 0; i < 7; i++) {
      this.emit("heart", c.x + (Math.random() - 0.5) * 12, c.y - 12, (Math.random() - 0.5) * 22, -14 - Math.random() * 16, 1.2, 0, pick(["pink", "red"]), 0);
    }
    this.advanceCat();
  }

  private advanceCat() {
    const d = this.catDlg;
    if (!d) return;
    const line = d.queue.shift();
    if (!line) {
      this.catDlg = null;
      this.publish();
      return;
    }
    d.key++;
    d.text = line;
    sfx.blip(640);
    this.publish();
  }

  private startDialog(n: Npc, intro: boolean) {
    n.moving = false;
    n.tx = null;
    n.dir = dirOf(this.player.x - n.x, this.player.y - n.y);
    this.player.dir = dirOf(n.x - this.player.x, n.y - this.player.y);
    this.player.moving = false;
    this.tap = null;
    const lines: Line[] = intro && n.def.intro ? n.def.intro.map((l) => ({ text: l.text, react: l.react })) : [{ text: pick(n.def.greet), react: "wave" }];
    lines.push({ menu: true });
    this.dlg = { npc: n, queue: lines, seen: new Set(), intro, choosing: false, text: "", key: 0 };
    this.advance();
  }

  private advance() {
    const d = this.dlg;
    if (!d) return;
    const line = d.queue.shift();
    if (!line) {
      this.closeDialog();
      return;
    }
    if (line.react) this.react(d.npc, line.react);
    d.key++;
    if (line.menu) d.choosing = true;
    else {
      d.choosing = false;
      d.text = line.text ?? "";
    }
    this.publish();
  }

  private closeDialog() {
    const d = this.dlg;
    if (!d) return;
    d.npc.cooldown = 18;
    this.dlg = null;
    if (d.intro) this.phase = "zoomout";
    this.publish();
  }

  private react(n: Npc, type: Reaction) {
    n.anim = { type, t: 0, dur: DUR[type], em: 0, em2: 0 };
    const hy = n.y - 30 * (n.def.look.scale ?? 1);
    if (type !== "wave") sfx.pop();
    if (type === "gasp") this.emit("excl", n.x + 7, hy - 6, 0, -10, 0.9);
    if (type === "cheer") for (let i = 0; i < 16; i++) this.emit("confetti", n.x, hy, (Math.random() - 0.5) * 70, -40 - Math.random() * 40, 1.4, 0, pick(["#ff3b6b", "#ffd84d", "#4aa8ff", "#7be07b", "#ff9ec4"]), 90);
    if (type === "jump" || type === "salute" || type === "spin") for (let i = 0; i < 4; i++) this.emit("spark", n.x + (Math.random() - 0.5) * 20, hy + Math.random() * 12, 0, -10, 0.7, 0, "#fff3a8");
  }

  private emit(k: PK, x: number, y: number, vx: number, vy: number, life: number, size = 0, col = "#fff", g = 0) {
    if (this.parts.length > 320) return;
    this.parts.push({ k, x, y, vx, vy, g, t: 0, life, size: size || 1, col });
  }

  private roamZoom() {
    return clamp(Math.min(this.w / 200, this.h / 260), 1.8, 4.2);
  }

  // ------------------------------------------------------------ input
  private attach() {
    window.addEventListener("resize", this.onResize);
    window.addEventListener("keydown", this.onKey);
    window.addEventListener("keyup", this.onKeyUp);
    this.canvas.addEventListener("pointerdown", this.onDown);
    window.addEventListener("pointermove", this.onMove);
    window.addEventListener("pointerup", this.onUp);
    window.addEventListener("pointercancel", this.onUp);
  }
  private onResize = () => this.resize();
  private resize() {
    this.dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.w = window.innerWidth;
    this.h = window.innerHeight;
    this.canvas.width = Math.floor(this.w * this.dpr);
    this.canvas.height = Math.floor(this.h * this.dpr);
    this.canvas.style.width = this.w + "px";
    this.canvas.style.height = this.h + "px";
    const gr = this.g.createRadialGradient(this.w / 2, this.h / 2, Math.min(this.w, this.h) * 0.35, this.w / 2, this.h / 2, Math.max(this.w, this.h) * 0.75);
    gr.addColorStop(0, "rgba(60,10,50,0)");
    gr.addColorStop(1, "rgba(60,10,60,0.42)");
    this.vignette = gr;
  }
  private onKey = (e: KeyboardEvent) => {
    const k = e.key.toLowerCase();
    if (["arrowup", "arrowdown", "arrowleft", "arrowright", "w", "a", "s", "d"].includes(k)) {
      this.keys.add(k);
      e.preventDefault();
    }
    if ((k === "e" || k === "enter" || k === " ") && !this.modal() && this.phase === "play") {
      this.interact();
    }
  };
  private onKeyUp = (e: KeyboardEvent) => {
    this.keys.delete(e.key.toLowerCase());
  };
  private onDown = (e: PointerEvent) => {
    if (this.joy.id !== -1) return;
    this.joy.id = e.pointerId;
    this.joy.sx = e.clientX;
    this.joy.sy = e.clientY;
    this.joy.st = performance.now();
    this.joy.active = false;
    this.joy.vx = 0;
    this.joy.vy = 0;
  };
  private onMove = (e: PointerEvent) => {
    if (e.pointerId !== this.joy.id) return;
    const dx = e.clientX - this.joy.sx;
    const dy = e.clientY - this.joy.sy;
    if (!this.joy.active && Math.hypot(dx, dy) > 10) {
      this.joy.active = true;
      this.joy.ox = this.joy.sx;
      this.joy.oy = this.joy.sy;
    }
    if (this.joy.active) {
      const R = 46;
      const d = Math.hypot(e.clientX - this.joy.ox, e.clientY - this.joy.oy);
      const k = Math.min(1, d / R);
      this.joy.vx = d > 0 ? ((e.clientX - this.joy.ox) / d) * k : 0;
      this.joy.vy = d > 0 ? ((e.clientY - this.joy.oy) / d) * k : 0;
      // drag the base along if the finger goes far past it
      if (d > R * 1.6) {
        this.joy.ox += ((e.clientX - this.joy.ox) / d) * (d - R * 1.6);
        this.joy.oy += ((e.clientY - this.joy.oy) / d) * (d - R * 1.6);
      }
    }
  };
  private onUp = (e: PointerEvent) => {
    if (e.pointerId !== this.joy.id) return;
    const wasJoy = this.joy.active;
    this.joy.id = -1;
    this.joy.active = false;
    this.joy.vx = 0;
    this.joy.vy = 0;
    if (!wasJoy && performance.now() - this.joy.st < 350 && this.phase === "play" && !this.modal()) {
      const v = this.view();
      this.tap = { x: v.ox + e.clientX / this.cam.zoom, y: v.oy + e.clientY / this.cam.zoom, t: 0, stuck: 0 };
    }
  };

  // ------------------------------------------------------------ collision
  private blocked(x: number, y: number, hw: number, hh: number, self?: Npc): boolean {
    if (x < 10 || x > WW - 10 || y < 52 || y > WH - 2) return true;
    const x0 = x - hw;
    const x1 = x + hw;
    const y0 = y - hh;
    const y1 = y + 1;
    for (const s of this.world.solids) {
      if (x1 > s.x && x0 < s.x + s.w && y1 > s.y && y0 < s.y + s.h) return true;
    }
    const p = this.world.pond;
    if (((x - p.x) / (p.rx + 1)) ** 2 + ((y - p.y) / (p.ry + 1)) ** 2 < 1) return true;
    if (self) {
      if (Math.hypot(x - this.player.x, y - this.player.y) < 11) return true;
    } else {
      for (const n of this.npcs) if (Math.hypot(x - n.x, y - n.y) < 9) return true;
    }
    for (const n of this.npcs) if (n !== self && self && Math.hypot(x - n.x, y - n.y) < 9) return true;
    return false;
  }

  // ------------------------------------------------------------ loop
  private loop = (now: number) => {
    const dt = Math.min(0.05, (now - this.last) / 1000);
    this.last = now;
    this.time += dt;
    this.update(dt);
    this.render();
    this.raf = requestAnimationFrame(this.loop);
  };

  private update(dt: number) {
    const p = this.player;
    // intro timing
    if (this.phase === "intro" && !this.dlg) {
      this.introT += dt;
      if (this.introT > 1.7) this.startDialog(this.npcs[0], true);
    }
    // player movement
    p.moving = false;
    const canMove = this.phase === "play" && !this.modal();
    if (canMove) {
      let ax = 0;
      let ay = 0;
      if (this.keys.has("arrowleft") || this.keys.has("a")) ax -= 1;
      if (this.keys.has("arrowright") || this.keys.has("d")) ax += 1;
      if (this.keys.has("arrowup") || this.keys.has("w")) ay -= 1;
      if (this.keys.has("arrowdown") || this.keys.has("s")) ay += 1;
      let mag = 1;
      if (ax || ay) {
        this.tap = null;
      } else if (this.joy.active && Math.hypot(this.joy.vx, this.joy.vy) > 0.12) {
        ax = this.joy.vx;
        ay = this.joy.vy;
        mag = Math.min(1, Math.hypot(ax, ay) * 1.15);
        this.tap = null;
      } else if (this.tap) {
        const dx = this.tap.x - p.x;
        const dy = this.tap.y - p.y;
        const d = Math.hypot(dx, dy);
        this.tap.t += dt;
        if (d < 3 || this.tap.stuck > 0.5 || this.tap.t > 8) this.tap = null;
        else {
          ax = dx;
          ay = dy;
        }
      }
      const len = Math.hypot(ax, ay);
      if (len > 0.01) {
        const sp = 64 * mag;
        const vx = (ax / len) * sp * dt;
        const vy = (ay / len) * sp * dt;
        let moved = 0;
        if (!this.blocked(p.x + vx, p.y, 4, 3)) {
          p.x += vx;
          moved += Math.abs(vx);
        }
        if (!this.blocked(p.x, p.y + vy, 4, 3)) {
          p.y += vy;
          moved += Math.abs(vy);
        }
        if (moved > 0.05) {
          p.moving = true;
          p.walk += moved;
          p.dir = dirOf(ax, ay);
          if (this.tap) this.tap.stuck = 0;
        } else if (this.tap) this.tap.stuck += dt;
      }
    }

    for (const n of this.npcs) this.updateNpc(n, dt);
    for (const a of this.animals) this.updateAnimal(a, dt);
    this.updateCats(dt);
    this.updateParticles(dt);
    this.ambient(dt);

    // bumping into villagers
    if (this.phase === "play" && !this.modal()) {
      for (const n of this.npcs) {
        if (n.cooldown <= 0 && Math.hypot(n.x - p.x, n.y - p.y) < 17) {
          this.startDialog(n, false);
          break;
        }
      }
      const near = this.findNear();
      const key = near ? near.kind + (near.house?.id ?? "") + near.label : "";
      if (key !== this.nearKey) {
        this.nearKey = key;
        this.ui.near = near ? { kind: near.kind, label: near.label } : null;
        this.publish();
      }
    } else if (this.nearKey) {
      this.nearKey = "";
      this.ui.near = null;
      this.publish();
    }

    this.updateCamera(dt);
  }

  private findNear(): { kind: "house" | "fountain" | "cat"; label: string; house?: HouseInst; cat?: Cat } | null {
    const p = this.player;
    for (const c of this.cats) {
      const r = 22;
      if (Math.hypot(p.x - c.x, p.y - c.y) < r) {
        return { kind: "cat", label: `Say hello to ${c.def.name}`, cat: c };
      }
    }
    for (const h of this.world.houses) {
      if (!h.memory) continue;
      if (Math.hypot(p.x - h.zone.x, p.y - h.zone.y) < 22) {
        const done = this.ui.opened.includes(h.memory.id);
        return { kind: "house", label: done ? "View memory again 💞" : "Open memory 💌", house: h };
      }
    }
    const f = this.world.fountain;
    if (Math.hypot(p.x - f.x, p.y - (f.y + 16)) < 30) {
      return { kind: "fountain", label: this.ui.opened.length >= this.ui.total ? "Make a wish ✨" : "Heart Fountain ⛲" };
    }
    return null;
  }

  private updateNpc(n: Npc, dt: number) {
    const def = n.def;
    if (n.cooldown > 0) n.cooldown -= dt;
    n.jobT += dt;
    this.updateAnim(n, dt);
    n.moving = false;
    if (this.dlg && this.dlg.npc === n) return;
    if (def.id === "pip" && (this.phase === "title" || this.phase === "intro")) return;
    if (def.behavior === "work") {
      if (def.job === "hammer") {
        const phase = Math.floor(n.jobT * 3) % 2;
        if (phase === 1 && Math.random() < dt * 3.2) this.emit("spark", n.x + 8, n.y - 12, (Math.random() - 0.5) * 30, -20, 0.4, 0, "#ffe9a0", 40);
      }
      return;
    }
    const spd = def.speed ?? 22;
    const step = spd * dt;
    if (def.behavior === "carry" && def.route) {
      if (n.wait > 0) {
        n.wait -= dt;
        return;
      }
      const [tx, ty] = def.route[n.routeIdx % def.route.length];
      const dx = tx - n.x;
      const dy = ty - n.y;
      const d = Math.hypot(dx, dy);
      if (d < 2) {
        n.routeIdx++;
        n.wait = 1.6;
        return;
      }
      this.stepNpc(n, (dx / d) * step, (dy / d) * step);
      return;
    }
    // wander
    const isChicken = false;
    if (isChicken) return;
    if (n.tx === null || n.ty === null) {
      n.wait -= dt;
      if (n.wait <= 0) {
        for (let i = 0; i < 8; i++) {
          const a = Math.random() * Math.PI * 2;
          const r = Math.random() * def.radius;
          const tx = def.x + Math.cos(a) * r;
          const ty = def.y + Math.sin(a) * r;
          if (!this.blocked(tx, ty, 5, 4, n)) {
            n.tx = tx;
            n.ty = ty;
            n.stuck = 0;
            break;
          }
        }
        n.wait = 1 + Math.random() * 3;
      }
      return;
    }
    const dx = n.tx - n.x;
    const dy = n.ty - n.y;
    const d = Math.hypot(dx, dy);
    if (d < 2) {
      n.tx = null;
      n.ty = null;
      n.wait = 1.5 + Math.random() * 3.5;
      return;
    }
    const moved = this.stepNpc(n, (dx / d) * step, (dy / d) * step);
    if (moved < step * 0.2) {
      n.stuck += dt;
      if (n.stuck > 0.6) {
        n.tx = null;
        n.ty = null;
        n.wait = 0.5;
      }
    }
  }

  private stepNpc(n: Npc, vx: number, vy: number): number {
    let moved = 0;
    if (!this.blocked(n.x + vx, n.y, 4, 3, n)) {
      n.x += vx;
      moved += Math.abs(vx);
    }
    if (!this.blocked(n.x, n.y + vy, 4, 3, n)) {
      n.y += vy;
      moved += Math.abs(vy);
    }
    if (moved > 0.01) {
      n.moving = true;
      n.walk += moved;
      n.dir = dirOf(vx, vy);
    }
    return moved;
  }

  private updateAnim(n: Npc, dt: number) {
    const a = n.anim;
    if (!a) return;
    a.t += dt;
    const sc = n.def.look.scale ?? 1;
    const hy = n.y - 30 * sc;
    a.em += dt;
    switch (a.type) {
      case "blush":
        if (a.em > 0.22) {
          a.em = 0;
          this.emit("heart", n.x + (Math.random() - 0.5) * 12, hy, (Math.random() - 0.5) * 10, -22, 1.3, 0, pick(["pink", "red"]), 0);
        }
        break;
      case "dance":
        if (a.em > 0.25) {
          a.em = 0;
          this.emit("note", n.x + (Math.random() < 0.5 ? -9 : 9), hy + 4, (Math.random() - 0.5) * 14, -20, 1.2, 0, pick(["#ff5d8f", "#ffd84d", "#7b4fb3"]), 0);
        }
        break;
      case "cry":
        if (a.em > 0.1) {
          a.em = 0;
          this.emit("tear", n.x - 3 + (Math.random() < 0.5 ? 0 : 6), hy + 8, (Math.random() - 0.5) * 8, 8, 0.7, 0, "#8fd8ff", 60);
        }
        break;
      case "shake":
        if (a.em > 0.3) {
          a.em = 0;
          this.emit("sweat", n.x + 7, hy + 2, 3, 6, 0.9, 0, "#bfe8ff", 20);
        }
        break;
      case "cheer":
        if (a.em > 0.1) {
          a.em = 0;
          this.emit("confetti", n.x, hy, (Math.random() - 0.5) * 60, -40, 1.2, 0, pick(["#ff3b6b", "#ffd84d", "#4aa8ff", "#7be07b", "#ff9ec4"]), 90);
        }
        break;
      case "spin":
        if (a.em > 0.14) {
          a.em = 0;
          this.emit("spark", n.x + (Math.random() - 0.5) * 22, hy + Math.random() * 18, 0, -8, 0.6, 0, "#fff3a8");
        }
        break;
      case "laugh":
        if (a.em > 0.22) {
          a.em = 0;
          this.emit("heart", n.x + (Math.random() - 0.5) * 16, hy - 2, (Math.random() - 0.5) * 20, -26, 1.0, 0, "small", 0);
        }
        break;
      case "wave":
        if (a.em > 0.6) {
          a.em = 0;
          this.emit("heart", n.x + 8, hy - 2, 4, -18, 1.1, 0, "pink", 0);
        }
        break;
      default:
        break;
    }
    if (a.t >= a.dur) n.anim = null;
  }

  private updateAnimal(a: Animal, dt: number) {
    if (a.tx === null || a.ty === null) {
      a.wait -= dt;
      if (a.wait <= 0) {
        a.tx = PEN.x1 + Math.random() * (PEN.x2 - PEN.x1);
        a.ty = PEN.y1 + Math.random() * (PEN.y2 - PEN.y1);
        a.wait = 1 + Math.random() * 3;
      }
      return;
    }
    const dx = a.tx - a.x;
    const dy = a.ty - a.y;
    const d = Math.hypot(dx, dy);
    if (d < 1.5) {
      a.tx = null;
      a.ty = null;
      return;
    }
    const sp = 16 * dt;
    a.x += (dx / d) * sp;
    a.y += (dy / d) * sp;
    a.step += sp;
    if (Math.abs(dx) > 0.5) a.dir = dx < 0 ? 2 : 3;
  }

  private updateCats(dt: number) {
    for (const c of this.cats) {
      const talking = this.catDlg?.cat === c;
      const near = Math.hypot(c.x - this.player.x, c.y - this.player.y) < 62;
      const radius = 20;

      // look at the Princess when she is close, or while chatting
      if (talking) {
        c.dir = this.player.x < c.x ? 2 : 3;
        continue;
      }
      if (near) c.dir = this.player.x < c.x ? 2 : 3;

      if (c.tx === null || c.ty === null) {
        c.wait -= dt;
        if (c.wait <= 0) {
          c.tx = c.homeX + (Math.random() - 0.5) * radius * 2;
          c.ty = c.homeY + (Math.random() - 0.5) * radius;
          c.wait = 1.6 + Math.random() * 3.4;
        }
      } else {
        const dx = c.tx - c.x;
        const dy = c.ty - c.y;
        const dist = Math.hypot(dx, dy);
        if (dist < 1.2) {
          c.tx = null;
          c.ty = null;
        } else {
          const sp = 6 * dt;
          c.x += (dx / dist) * sp;
          c.y += (dy / dist) * sp;
          c.step += sp * 2.4;
          if (Math.abs(dx) > 0.4) c.dir = dx < 0 ? 2 : 3;
        }
      }

      // happy purring when the Princess is right next to it
      if (near) {
        c.purr -= dt;
        if (c.purr <= 0) {
          c.purr = 1.8 + Math.random() * 1.4;
          this.emit("heart", c.x, c.y - 13, (Math.random() - 0.5) * 8, -13, 1.1, 0, "pink", 0);
        }
      }
    }
  }

  private drawCat(g: CanvasRenderingContext2D, c: Cat, t: number) {
    const spr = catSprite(c.def.coat);
    this.shadow(g, c.x, c.y, 0.85, 0.24);

    g.save();
    g.translate(Math.round(c.x), Math.round(c.y));
    if (c.dir === 3) g.scale(-1, 1);
    g.drawImage(spr, -Math.round(spr.width / 2), -spr.height + 2);
    g.restore();

    // tail sway — same little two-pixel tail as the original cat
    const w = Math.sin(t * 3 + c.homeX) * 2;
    const dirk = c.dir === 3 ? -1 : 1;
    g.fillStyle = c.def.coat.base;
    g.fillRect(Math.round(c.x + dirk * 5), Math.round(c.y - 4), 3 * dirk, 1);
    g.fillRect(Math.round(c.x + dirk * 7), Math.round(c.y - 5 - w * 0.5), 1 * dirk, 2);
  }

  private updateParticles(dt: number) {
    for (const p of this.parts) {
      p.t += dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += p.g * dt;
      if (p.k === "heart" || p.k === "note") p.vx += Math.sin(p.t * 6 + p.x) * 12 * dt;
    }
    this.parts = this.parts.filter((p) => p.t < p.life);
  }

  private ambient(dt: number) {
    this.smokeT += dt;
    if (this.smokeT > 0.5) {
      this.smokeT = 0;
      for (const c of this.world.chimneys) this.emit("smoke", c.x + (Math.random() - 0.5) * 2, c.y, 3 + Math.random() * 4, -9, 3.2, 2);
    }
    this.fountT += dt;
    if (this.fountT > 0.12) {
      this.fountT = 0;
      const f = this.world.fountain;
      this.emit("drop", f.x + (Math.random() - 0.5) * 14, f.y - 28, (Math.random() - 0.5) * 22, -14, 0.8, 0, "#d6f4ff", 60);
      if (Math.random() < 0.14) this.emit("heart", f.x + (Math.random() - 0.5) * 8, f.y - 40, (Math.random() - 0.5) * 6, -14, 2.2, 0, pick(["pink", "red", "gold"]), 0);
    }
    for (const b of this.world.houses) {
      if (Math.random() < dt * 0.25) this.emit("heart", b.x + (Math.random() - 0.5) * 40, b.y - 30, (Math.random() - 0.5) * 8, -12, 2.0, 0, "small", 0);
    }
  }

  private updateCamera(dt: number) {
    const c = this.cam;
    const p = this.player;
    const rz = this.roamZoom();
    if (this.phase === "title") {
      c.x = 448 + Math.sin(this.time * 0.12) * 170;
      c.y = 380 + Math.cos(this.time * 0.09) * 110;
      c.zoom = Math.max(rz * 0.85, 1.6);
      c.fy = 0.5;
      return;
    }
    let tx = p.x;
    let ty = p.y;
    let tz = rz;
    let tf = 0.5;
    let kp = 6;
    let kz = 3;
    const pip = this.npcs[0];
    if (this.dlg) {
      const n = this.dlg.npc;
      tx = (n.x + p.x) / 2;
      ty = (n.y + p.y) / 2 - 6;
      tz = this.dlg.intro ? Math.min(rz * 2.2, 7.5) : Math.min(rz * 1.55, 6);
      // 0.5 keeps the middle of the pair dead centre, so the Herald is not
      // squashed against the top of the screen (his confetti used to fly
      // straight off-screen)
      tf = 0.5;
      kp = 3;
      kz = 2.4;
    } else if (this.catDlg) {
      const c = this.catDlg.cat;
      tx = (c.x + p.x) / 2;
      ty = (c.y + p.y) / 2 - 4;
      tz = Math.min(rz * 1.7, 6.4);
      tf = 0.5;
      kp = 3;
      kz = 2.4;
    } else if (this.phase === "intro") {
      tx = pip.x;
      ty = (pip.y + p.y) / 2 - 6;
      tz = Math.min(rz * 2.2, 7.5);
      tf = 0.5;
      kp = 3;
      kz = 2.4;
    } else if (this.phase === "zoomout") {
      kz = 1.5;
      kp = 3;
    }
    const kk = (k: number) => 1 - Math.exp(-k * dt);
    c.x += (tx - c.x) * kk(kp);
    c.y += (ty - c.y) * kk(kp);
    c.zoom += (tz - c.zoom) * kk(kz);
    c.fy += (tf - c.fy) * kk(3);
    if (this.phase === "zoomout" && Math.abs(c.zoom - rz) < 0.1) {
      this.phase = "play";
      this.publish();
    }
  }

  private view() {
    const z = this.cam.zoom;
    const vw = this.w / z;
    const vh = this.h / z;
    let ox = this.cam.x - vw / 2;
    let oy = this.cam.y - vh * this.cam.fy;
    ox = vw >= WW ? (WW - vw) / 2 : clamp(ox, 0, WW - vw);
    const maxY = WH + 90 - vh;
    oy = maxY <= 0 ? maxY / 2 : clamp(oy, 0, maxY);
    this.vw = vw;
    return { ox, oy, vw, vh };
  }

  // ------------------------------------------------------------ render
  private poseOf(n: Npc) {
    const def = n.def;
    let dir: Dir = n.dir;
    let leg = 0;
    let armL = 0;
    let armR = 0;
    let dx = 0;
    let dy = 0;
    let sx = 1;
    let sy = 1;
    if (n.moving) {
      leg = LEG[Math.floor(n.walk / 4) % 4];
      armL = leg === 1 ? 3 : leg === 2 ? 1 : 0;
      armR = leg === 1 ? 1 : leg === 2 ? 3 : 0;
    }
    if (def.job === "hammer") {
      armR = Math.floor(this.time * 3) % 2 === 0 ? 2 : 3;
    } else if (def.job === "hang") {
      armL = 2;
      armR = 2;
      dy = Math.sin(this.time * 2) * 0.6;
    } else if (def.job === "paint") {
      armR = Math.floor(this.time * 2.2) % 2 === 0 ? 1 : 3;
    } else if (def.job === "carry") {
      armL = 2;
      armR = 2;
    }
    const a = n.anim;
    if (a) {
      const t = a.t;
      const p = Math.min(1, t / a.dur);
      switch (a.type) {
        case "jump":
          dy = -Math.abs(Math.sin((t * Math.PI) / 0.4)) * 7;
          if (dy < -2) {
            armL = 2;
            armR = 2;
          }
          break;
        case "spin":
          dir = FACE[Math.floor(t * 9) % 4];
          dy = -Math.abs(Math.sin((t * Math.PI) / 0.5)) * 3;
          break;
        case "bow": {
          const s = Math.sin(p * Math.PI);
          sy = 1 - 0.17 * s;
          sx = 1 + 0.05 * s;
          dir = 0;
          break;
        }
        case "blush":
          dx = Math.sin(t * 9) * 1;
          armL = 1;
          armR = 1;
          break;
        case "dance": {
          dx = Math.sin(t * 9) * 2.2;
          dy = -Math.abs(Math.sin(t * 9)) * 3;
          dir = Math.floor(t * 4.5) % 2 ? 2 : 3;
          const f = Math.floor(t * 4.5) % 2;
          armL = f ? 2 : 0;
          armR = f ? 0 : 2;
          leg = f ? 1 : 2;
          break;
        }
        case "shake":
          dx = Math.sin(t * 55) * 1.3;
          armL = 1;
          armR = 1;
          break;
        case "cry":
          sy = 1 + Math.sin(t * 14) * 0.03;
          armL = 1;
          armR = 1;
          dir = 0;
          break;
        case "salute":
          armR = 2;
          sy = 1.03;
          break;
        case "wave":
          armR = Math.floor(t * 5.5) % 2 ? 2 : 1;
          dy = -Math.abs(Math.sin(t * 3)) * 1.2;
          break;
        case "gasp": {
          const s = Math.sin(Math.min(1, p / 0.3) * Math.PI);
          sx = 1 + 0.15 * s;
          sy = 1 + 0.15 * s;
          dy = -s * 3;
          if (p < 0.6) {
            armL = 2;
            armR = 2;
          }
          break;
        }
        case "laugh":
          dy = -Math.abs(Math.sin(t * 16)) * 2.2;
          break;
        case "cheer":
          armL = 2;
          armR = 2;
          dy = -Math.abs(Math.sin(t * 8)) * 4;
          break;
      }
    }
    return { dir, leg, armL, armR, dx, dy, sx, sy };
  }

  private shadow(g: CanvasRenderingContext2D, x: number, y: number, s = 1, a = 0.28) {
    g.fillStyle = `rgba(35,10,45,${a})`;
    g.beginPath();
    g.ellipse(Math.round(x), Math.round(y) - 1, 7 * s, 2.7 * s, 0, 0, Math.PI * 2);
    g.fill();
  }

  private drawNpc(g: CanvasRenderingContext2D, n: Npc) {
    const def = n.def;
    const pose = this.poseOf(n);
    const sc = def.look.scale ?? 1;
    this.shadow(g, n.x, n.y, sc, 0.28);
    const gx = Math.round(n.x + pose.dx);
    const gy = Math.round(n.y + pose.dy);
    if (def.id === "bram" && !n.anim) {
      g.fillStyle = "#8a5a34";
      g.fillRect(gx + 11, gy - 34, 1, 35);
      g.fillStyle = "#e3ebf7";
      g.fillRect(gx + 10, gy - 39, 3, 5);
      g.fillStyle = "#ff4d6d";
      g.fillRect(gx + 12, gy - 33, 4, 3);
    }
    drawChar(g, def.look, gx, gy, pose.dir, pose.leg, pose.armL, pose.armR, { sx: pose.sx, sy: pose.sy });
    // blush overlay
    if (n.anim?.type === "blush" && pose.dir === 0) {
      g.fillStyle = "rgba(255,60,110,0.55)";
      g.fillRect(gx - 5 * sc, gy - 20 * sc, 3 * sc, 2 * sc);
      g.fillRect(gx + 2 * sc, gy - 20 * sc, 3 * sc, 2 * sc);
    }
    // job tools
    if (def.job === "hammer") {
      const up = pose.armR === 2;
      g.fillStyle = "#8a5a34";
      if (up) {
        g.fillRect(gx + 6, gy - 28, 1, 8);
        g.fillStyle = "#aab4c4";
        g.fillRect(gx + 4, gy - 31, 5, 3);
      } else {
        g.fillRect(gx + 4, gy - 16, 1, 7);
        g.fillStyle = "#aab4c4";
        g.fillRect(gx + 2, gy - 18, 5, 3);
      }
    } else if (def.job === "paint") {
      const o = pose.armR === 1 ? -3 : 0;
      g.fillStyle = "#8a5a34";
      g.fillRect(gx - 11 + o, gy - 14, 5, 1);
      g.fillStyle = "#ff3b6b";
      g.fillRect(gx - 14 + o, gy - 15, 3, 3);
    } else if (def.job === "hang") {
      for (let i = 0; i <= 8; i++) {
        const t = i / 8;
        const hx = gx - 7 + t * 14;
        const hy = gy - 33 + Math.sin(t * Math.PI) * 4;
        g.fillStyle = "#d6a86a";
        g.fillRect(Math.round(hx), Math.round(hy), 1, 1);
        if (i % 2 === 0 && i > 0 && i < 8) g.drawImage(this.world.hearts.small, Math.round(hx) - 4, Math.round(hy) + 1);
      }
    } else if (def.job === "carry") {
      const bob = Math.sin(this.time * 6) * (n.moving ? 1 : 0.3);
      g.drawImage(giftBoxSprite(), gx - 9, Math.round(gy - 47 + bob));
    }
  }

  private render() {
    const g = this.g;
    const dpr = this.dpr;
    const z = this.cam.zoom;
    const v = this.view();
    const t = this.time;
    g.setTransform(1, 0, 0, 1, 0, 0);
    g.imageSmoothingEnabled = false;
    g.fillStyle = "#2f7a3e";
    g.fillRect(0, 0, this.canvas.width, this.canvas.height);
    const sc = z * dpr;
    g.setTransform(sc, 0, 0, sc, -Math.round(v.ox * sc), -Math.round(v.oy * sc));
    g.imageSmoothingEnabled = false;
    g.drawImage(this.world.ground, 0, 0);

    // pond shimmer
    const pd = this.world.pond;
    for (let i = 0; i < 16; i++) {
      const a = i * 1.9;
      const px = pd.x + Math.cos(a) * pd.rx * 0.7 * Math.sin(t * 0.3 + i);
      const py = pd.y + Math.sin(a * 1.3) * pd.ry * 0.6;
      g.fillStyle = `rgba(255,255,255,${0.25 + 0.35 * Math.abs(Math.sin(t * 1.5 + i))})`;
      g.fillRect(Math.round(px), Math.round(py), 3, 1);
    }

    // y-sorted draw list
    type Item = { y: number; f: () => void };
    const items: Item[] = [];
    const pad = 70;
    for (const o of this.world.objs) {
      if (o.x < v.ox - pad || o.x > v.ox + v.vw + pad || o.y < v.oy - 10 || o.y > v.oy + v.vh + pad) continue;
      items.push({
        y: o.sortY,
        f: () => {
          g.fillStyle = o.kind === "tree" ? "rgba(30,60,30,0.22)" : "rgba(35,10,45,0.0)";
          if (o.kind === "tree") {
            g.beginPath();
            g.ellipse(o.x, o.y - 1, 11, 3.5, 0, 0, Math.PI * 2);
            g.fill();
          }
          g.drawImage(o.sprite.c, Math.round(o.x - o.sprite.ax), Math.round(o.y - o.sprite.ay));
        },
      });
    }
    for (const n of this.npcs) items.push({ y: n.y, f: () => this.drawNpc(g, n) });
    for (const c of this.cats) items.push({ y: c.y, f: () => this.drawCat(g, c, t) });
    for (const a of this.animals) {
      items.push({
        y: a.y,
        f: () => {
          {
            this.shadow(g, a.x, a.y, 0.6);
            const spr = chickenSprite(a.brown, Math.floor(a.step / 3) % 2);
            g.save();
            g.translate(Math.round(a.x), Math.round(a.y));
            if (a.dir === 3) g.scale(-1, 1);
            g.drawImage(spr, -6, -11);
            g.restore();
          }
        },
      });
    }
    const p = this.player;
    items.push({
      y: p.y,
      f: () => {
        this.shadow(g, p.x, p.y);
        const leg = p.moving ? LEG[Math.floor(p.walk / 4) % 4] : 0;
        const aL = leg === 1 ? 3 : leg === 2 ? 1 : 0;
        const aR = leg === 1 ? 1 : leg === 2 ? 3 : 0;
        const bob = p.moving && leg === 0 ? -0.5 : 0;
        drawChar(g, PRINCESS_LOOK, p.x, p.y + bob, p.dir, leg, aL, aR);
      },
    });
    items.sort((a, b) => a.y - b.y);
    for (const it of items) it.f();

    // floating hearts above memory houses
    for (const h of this.world.houses) {
      if (!h.memory) continue;
      if (h.x < v.ox - 80 || h.x > v.ox + v.vw + 80 || h.y < v.oy - 20 || h.y > v.oy + v.vh + 140) continue;
      const done = this.ui.opened.includes(h.memory.id);
      const bob = Math.sin(t * 2.4 + h.x) * 2.5;
      const spr = done ? this.world.hearts.bigGold : this.world.hearts.big;
      const sz = done ? 1 : 1 + Math.sin(t * 5 + h.x) * 0.08;
      g.save();
      g.translate(h.x, h.top - 8 + bob);
      g.scale(sz, sz);
      g.drawImage(spr, -spr.width / 2, -spr.height / 2);
      g.restore();
      if (!done) {
        g.fillStyle = `rgba(255,255,255,${0.5 + 0.5 * Math.sin(t * 6 + h.x)})`;
        g.fillRect(Math.round(h.x + 8), Math.round(h.top - 16 + bob), 1, 3);
        g.fillRect(Math.round(h.x + 7), Math.round(h.top - 15 + bob), 3, 1);
      }
    }

    // bunting
    for (const b of this.world.bunting) {
      const n = Math.max(3, Math.round(Math.hypot(b.x2 - b.x1, b.y2 - b.y1) / 9));
      for (let i = 0; i <= n; i++) {
        const u = i / n;
        const x = b.x1 + (b.x2 - b.x1) * u;
        const y = b.y1 + (b.y2 - b.y1) * u + Math.sin(u * Math.PI) * b.sag;
        g.fillStyle = "#d6a86a";
        g.fillRect(Math.round(x), Math.round(y), 2, 1);
        if (i > 0 && i < n) {
          const sw = Math.round(Math.sin(t * 2 + i * 0.9) * 1);
          g.drawImage(i % 2 ? this.world.hearts.red : this.world.hearts.pink, Math.round(x) - 5 + sw, Math.round(y));
        }
      }
    }

    // balloons
    for (const b of this.world.balloons) {
      const bx = b.x + Math.sin(t * 1.1 + b.ph) * 3;
      const by = b.y - 20 + Math.sin(t * 1.5 + b.ph) * 2.5;
      g.fillStyle = "rgba(255,255,255,0.7)";
      g.fillRect(Math.round((bx + b.x) / 2), Math.round(by + 15), 1, Math.round(b.y - by - 15));
      g.drawImage(this.world.balloonSprites[b.col], Math.round(bx - 7), Math.round(by - 3));
    }

    // particles
    this.drawParticles(g);

    // doves
    for (let i = 0; i < 3; i++) {
      const a = t * (0.25 + i * 0.04) + i * 2.1;
      const rx = 190 + i * 40;
      const x = 448 + Math.cos(a) * rx;
      const y = 330 + Math.sin(a) * rx * 0.45 - 60 - i * 12;
      const dir = -Math.sin(a) > 0 ? 1 : -1;
      const spr = doveSprite(Math.floor(t * 6 + i) % 2);
      g.fillStyle = "rgba(30,10,40,0.12)";
      g.beginPath();
      g.ellipse(x, y + 78, 4, 1.5, 0, 0, Math.PI * 2);
      g.fill();
      g.save();
      g.translate(Math.round(x), Math.round(y));
      g.scale(dir, 1);
      g.drawImage(spr, -5, -4);
      g.restore();
    }

    // lamp glow
    g.globalCompositeOperation = "lighter";
    for (const l of this.world.glows) {
      if (l.x < v.ox - 60 || l.x > v.ox + v.vw + 60 || l.y < v.oy - 60 || l.y > v.oy + v.vh + 60) continue;
      const fl = 0.2 + 0.05 * Math.sin(t * 5 + l.seed) + 0.03 * Math.sin(t * 11 + l.seed * 2);
      const gr = g.createRadialGradient(l.x, l.y, 0, l.x, l.y, l.r);
      gr.addColorStop(0, `rgba(255,190,100,${fl})`);
      gr.addColorStop(1, "rgba(255,150,80,0)");
      g.fillStyle = gr;
      g.fillRect(l.x - l.r, l.y - l.r, l.r * 2, l.r * 2);
    }
    g.globalCompositeOperation = "source-over";

    // -------- screen space --------
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    g.fillStyle = "rgba(255,160,110,0.08)";
    g.fillRect(0, 0, this.w, this.h);
    if (this.vignette) {
      g.fillStyle = this.vignette;
      g.fillRect(0, 0, this.w, this.h);
    }
    // petals
    for (const pt of this.petals) {
      pt.y += pt.sp * 0.016;
      pt.x += Math.sin(t * 0.8 + pt.ph) * 0.0004 + 0.0002;
      if (pt.y > 1.05) {
        pt.y = -0.05;
        pt.x = Math.random();
      }
      if (pt.x > 1.05) pt.x = -0.05;
      g.fillStyle = pt.c;
      g.globalAlpha = 0.8;
      const s = pt.s * (0.8 + 0.4 * Math.sin(t * 3 + pt.ph));
      g.fillRect(Math.round(pt.x * this.w), Math.round(pt.y * this.h), Math.max(2, s * 1.6), Math.max(2, s));
    }
    g.globalAlpha = 1;

    // name tags — cats use the very same tag as the villagers
    if (this.catDlg) {
      const c = this.catDlg.cat;
      this.tag(g, `${c.def.name} · ${c.def.title}`, (c.x - v.ox) * z, (c.y - 17 - v.oy) * z, 1);
    } else if (this.dlg) {
      const n = this.dlg.npc;
      const sx = (n.x - v.ox) * z;
      const sy = (n.y - 42 * (n.def.look.scale ?? 1) - v.oy) * z;
      this.tag(g, `${n.def.name} · ${n.def.title}`, sx, sy, 1);
    } else if (this.phase === "play") {
      for (const n of this.npcs) {
        const d = Math.hypot(n.x - p.x, n.y - p.y);
        if (d > 80) continue;
        const sx = (n.x - v.ox) * z;
        const sy = (n.y - 40 * (n.def.look.scale ?? 1) - v.oy) * z;
        this.tag(g, n.def.name, sx, sy, Math.min(1, (80 - d) / 30));
      }
      for (const c of this.cats) {
        const d = Math.hypot(c.x - p.x, c.y - p.y);
        if (d > 80) continue;
        const sx = (c.x - v.ox) * z;
        const sy = (c.y - 17 - v.oy) * z;
        this.tag(g, c.def.name, sx, sy, Math.min(1, (80 - d) / 30));
      }
    }

    // joystick
    if (this.joy.active) {
      const j = this.joy;
      g.beginPath();
      g.arc(j.ox, j.oy, 46, 0, Math.PI * 2);
      g.fillStyle = "rgba(255,255,255,0.1)";
      g.fill();
      g.lineWidth = 2;
      g.strokeStyle = "rgba(255,255,255,0.45)";
      g.stroke();
      g.beginPath();
      g.arc(j.ox + j.vx * 46, j.oy + j.vy * 46, 19, 0, Math.PI * 2);
      g.fillStyle = "rgba(255,190,215,0.65)";
      g.fill();
      g.strokeStyle = "rgba(255,255,255,0.9)";
      g.stroke();
    }
    // tap marker
    if (this.tap) {
      const sx = (this.tap.x - v.ox) * z;
      const sy = (this.tap.y - v.oy) * z;
      g.beginPath();
      g.ellipse(sx, sy, 10 + Math.sin(t * 8) * 2, 5, 0, 0, Math.PI * 2);
      g.strokeStyle = "rgba(255,255,255,0.75)";
      g.lineWidth = 2;
      g.stroke();
    }
  }

  private tag(g: CanvasRenderingContext2D, text: string, x: number, y: number, a: number) {
    g.save();
    g.globalAlpha = a;
    g.font = "700 12px ui-rounded, 'Trebuchet MS', system-ui, sans-serif";
    g.textAlign = "center";
    g.textBaseline = "middle";
    const w = g.measureText(text).width + 14;
    g.fillStyle = "rgba(50,20,60,0.72)";
    g.beginPath();
    g.roundRect(x - w / 2, y - 10, w, 20, 10);
    g.fill();
    g.strokeStyle = "rgba(255,200,220,0.7)";
    g.lineWidth = 1;
    g.stroke();
    g.fillStyle = "#fff";
    g.fillText(text, x, y + 0.5);
    g.restore();
  }

  private drawParticles(g: CanvasRenderingContext2D) {
    const H = this.world.hearts;
    for (const p of this.parts) {
      const u = p.t / p.life;
      const a = u > 0.7 ? 1 - (u - 0.7) / 0.3 : 1;
      g.globalAlpha = clamp(a, 0, 1);
      const x = Math.round(p.x);
      const y = Math.round(p.y);
      switch (p.k) {
        case "heart": {
          const spr = H[p.col] ?? H.pink;
          g.drawImage(spr, x - Math.round(spr.width / 2), y - Math.round(spr.height / 2));
          break;
        }
        case "spark":
          g.fillStyle = p.col;
          g.fillRect(x - 1, y - 3, 2, 6);
          g.fillRect(x - 3, y - 1, 6, 2);
          g.fillStyle = "#fff";
          g.fillRect(x - 1, y - 1, 2, 2);
          break;
        case "tear":
          g.fillStyle = p.col;
          g.fillRect(x, y, 2, 3);
          g.fillStyle = "#fff";
          g.fillRect(x, y, 1, 1);
          break;
        case "drop":
          g.fillStyle = p.col;
          g.fillRect(x, y, 1, 2);
          break;
        case "sweat":
          g.fillStyle = p.col;
          g.fillRect(x, y, 3, 4);
          g.fillRect(x + 1, y - 1, 1, 1);
          g.fillStyle = "#fff";
          g.fillRect(x + 1, y + 1, 1, 1);
          break;
        case "note":
          g.fillStyle = "#2b1b2e";
          g.fillRect(x + 2, y - 5, 1, 7);
          g.fillRect(x, y + 1, 3, 2);
          g.fillStyle = p.col;
          g.fillRect(x + 1, y, 2, 2);
          g.fillRect(x + 3, y - 5, 2, 1);
          break;
        case "excl":
          g.fillStyle = "#2b1b2e";
          g.fillRect(x - 2, y - 7, 5, 11);
          g.fillStyle = "#ff3b5c";
          g.fillRect(x - 1, y - 6, 3, 6);
          g.fillRect(x - 1, y + 1, 3, 2);
          g.fillStyle = "#fff";
          g.fillRect(x - 1, y - 6, 1, 3);
          break;
        case "confetti":
          g.fillStyle = p.col;
          g.fillRect(x, y, 2, 1 + (Math.floor(p.t * 10) % 2));
          break;
        case "smoke":
          g.fillStyle = `rgba(245,240,248,${0.35 * (1 - u)})`;
          g.beginPath();
          g.arc(p.x, p.y, p.size + u * 4, 0, Math.PI * 2);
          g.fill();
          break;
      }
    }
    g.globalAlpha = 1;
  }
}
