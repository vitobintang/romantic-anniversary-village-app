"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Compass,
  Flower2,
  Gift,
  Heart,
  HeartHandshake,
  MessageCircle,
  Music2,
  Package,
  PawPrint,
  Plane,
  Sparkles,
  Volume2,
  VolumeX,
  X,
} from "lucide-react";
import NumberFlow from "@number-flow/react";
import { Toaster, toast as notify } from "sonner";
import { Game, UiState, DialogView } from "@/game/engine";
import { MEMORIES, NPCS, FINALE, MONTHS, COLLECTION } from "@/game/config";
import { catSprite, charSprite } from "@/game/sprites";
import * as audio from "@/game/audio";

const EMPTY: UiState = {
  phase: "title",
  dialog: null,
  near: null,
  opened: [],
  total: MEMORIES.length,
  photo: null,
  finale: false,
  toast: null,
};

export default function GameApp() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameRef = useRef<Game | null>(null);
  const [ui, setUi] = useState<UiState>(EMPTY);
  const [ready, setReady] = useState(false);
  const [muted, setMuted] = useState(false);
  const [hint, setHint] = useState(false);

  useEffect(() => {
    const c = canvasRef.current;
    if (!c) return;
    const t = setTimeout(() => {
      const g = new Game(c, setUi);
      gameRef.current = g;
      setReady(true);
    }, 30);
    return () => {
      clearTimeout(t);
      gameRef.current?.destroy();
      gameRef.current = null;
      audio.dispose();
    };
  }, []);

  useEffect(() => {
    if (ui.phase === "play") {
      setHint(true);
      const t = setTimeout(() => setHint(false), 7000);
      return () => clearTimeout(t);
    }
  }, [ui.phase === "play"]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!ui.toast) return;
    notify(ui.toast.text, {
      id: `toast-${ui.toast.id}`,
      icon: <Sparkles size={16} strokeWidth={2.5} />,
      duration: 4200,
      className: "village-toast",
    });
  }, [ui.toast?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const begin = useCallback(() => {
    audio.startMusic();
    gameRef.current?.start();
  }, []);

  const toggleMute = () => {
    const m = !muted;
    setMuted(m);
    audio.setMuted(m);
  };

  const memory = ui.photo ? MEMORIES.find((m) => m.id === ui.photo) : null;

  return (
    <div className="game-root">
      <canvas ref={canvasRef} className="game-canvas" />
      <Toaster
        position="top-center"
        offset={76}
        gap={8}
        toastOptions={{ unstyled: false, className: "village-toast" }}
      />

      {ui.phase === "title" && <TitleScreen ready={ready} onStart={begin} />}

      {ui.phase !== "title" && (
        <div className="hud">
          <div className="hud-top">
            <div className="chip">
              <Heart className="chip-heart" size={14} strokeWidth={0} fill="currentColor" />
              <span className="chip-count">
                {ui.opened.length}/{ui.total}
              </span>
              <span className="chip-dots">
                {MEMORIES.map((m) => (
                  <i key={m.id} className={ui.opened.includes(m.id) ? "on" : ""} />
                ))}
              </span>
            </div>
            <button className="chip round" onClick={toggleMute} aria-label="toggle sound">
              {muted ? <VolumeX size={18} /> : <Music2 size={18} />}
            </button>
          </div>

          {hint && ui.phase === "play" && !ui.dialog && !ui.photo && (
            <div className="hint">
              <MessageCircle size={14} />
              <span>Drag to walk · tap to travel · bump into villagers to chat</span>
            </div>
          )}


          {ui.near && !ui.dialog && !ui.photo && !ui.finale && (
            <button className="action" onClick={() => gameRef.current?.interact()}>
              {ui.near.label.toLowerCase().includes("memory") ? (
                <Gift size={18} />
              ) : ui.near.label.toLowerCase().includes("hello") ? (
                <PawPrint size={18} />
              ) : ui.near.label.toLowerCase().includes("talk") ? (
                <MessageCircle size={18} />
              ) : (
                <ArrowRight size={18} />
              )}
              <span>{ui.near.label}</span>
            </button>
          )}
        </div>
      )}

      {ui.dialog && (
        <DialogBox
          key={ui.dialog.npcId + (ui.phase === "intro" ? "i" : "")}
          d={ui.dialog}
          onNext={() => gameRef.current?.next()}
          onChoose={(i) => gameRef.current?.choose(i)}
        />
      )}

      {memory && <Polaroid memory={memory} count={ui.opened.length} total={ui.total} onClose={() => gameRef.current?.closePhoto()} />}

      {ui.finale && <Finale onClose={() => gameRef.current?.closeFinale()} />}
    </div>
  );
}

function TitleScreen({ ready, onStart }: { ready: boolean; onStart: () => void }) {
  const hearts = useMemo(
    () =>
      Array.from({ length: 16 }, (_, i) => ({
        left: (i * 37) % 100,
        delay: (i * 0.7) % 9,
        dur: 8 + ((i * 13) % 7),
        size: 14 + ((i * 11) % 22),
      })),
    [],
  );
  return (
    <div className="title">
      <div className="title-glow" aria-hidden />
      <div className="floaters">
        {hearts.map((h, i) => (
          <span key={i} style={{ left: `${h.left}%`, animationDelay: `${h.delay}s`, animationDuration: `${h.dur}s` }}>
            {i % 3 === 0 ? (
              <Heart size={h.size} strokeWidth={0} fill="currentColor" />
            ) : i % 3 === 1 ? (
              <Flower2 size={h.size} strokeWidth={1.6} />
            ) : (
              <Sparkles size={h.size} strokeWidth={1.6} />
            )}
          </span>
        ))}
      </div>
      <div className="title-card">
        <div className="title-crest">
          <Heart size={17} strokeWidth={0} fill="currentColor" />
        </div>
        <div className="title-eyebrow">
          <span className="eyebrow-rule" />
          <span>A little village made with love</span>
          <span className="eyebrow-rule" />
        </div>
        <div className="title-num">
          <NumberFlow value={MONTHS} />
        </div>
        <div className="title-sub">Monthversary</div>
        <div className="title-divider" aria-hidden />
        <p className="title-copy">For my Princess. Come visit Loveberry Village — everyone has been waiting for you.</p>
        <button className="title-btn" disabled={!ready} onClick={onStart}>
          <span>{ready ? "Enter the Village" : "Gathering petals…"}</span>
          <ArrowRight size={18} strokeWidth={2.75} />
        </button>
        <div className="title-note">
          <Volume2 size={12} />
          <span>Sound on for the full experience</span>
        </div>
      </div>
    </div>
  );
}

function Portrait({ d }: { d: DialogView }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const c = ref.current;
    if (!c) return;
    const g = c.getContext("2d")!;
    g.imageSmoothingEnabled = false;
    if (d.kind === "cat" && d.coat) {
      const size = 70;
      c.width = size;
      c.height = size;
      const spr = catSprite(d.coat);
      g.clearRect(0, 0, size, size);
      g.drawImage(spr, 0, 0, spr.width, spr.height, 0, 0, size, size);
      return;
    }
    const def = NPCS.find((n) => n.id === d.npcId);
    if (!def) return;
    c.width = 24;
    c.height = 24;
    g.clearRect(0, 0, c.width, c.height);
    const spr = charSprite(def.look, 0, 0, 0, 0);
    g.drawImage(spr, 0, 0, 24, 24, 0, 0, 24, 24);
  }, [d]);
  return <canvas ref={ref} width={24} height={24} className="portrait" />;
}

function DialogBox({ d, onNext, onChoose }: { d: DialogView; onNext: () => void; onChoose: (i: number) => void }) {
  const [n, setN] = useState(0);
  const len = d.text.length;
  const done = n >= len;

  useEffect(() => {
    setN(0);
    let i = 0;
    const id = setInterval(() => {
      i++;
      setN(i);
      if (i % 2 === 0) audio.blip(d.voice);
      if (i >= d.text.length) clearInterval(id);
    }, 26);
    return () => clearInterval(id);
  }, [d.text, d.voice]);

  const click = () => {
    if (!done) setN(len);
    else if (!d.choices) onNext();
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        if (!done) setN(len);
        else if (!d.choices) onNext();
      }
      if (d.choices && done) {
        const k = parseInt(e.key);
        if (k >= 1 && k <= d.choices.length) onChoose(k - 1);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  return (
    <div className="dlg-wrap">
      <div className={`dlg ${d.apology ? "sorry" : ""}`}>
        <div className="dlg-head">
          <div className={`portrait-frame ${!done ? "talk" : ""}`}>
            <Portrait d={d} />
          </div>
          <div className="dlg-name">
            <b>{d.name}</b>
            <span>{d.title}</span>
          </div>
        </div>
        <div className="dlg-text" onClick={click}>
          <p className="dlg-line">
            {d.text.slice(0, n)}
            {!done && <span className="caret" />}
          </p>
          {done && !d.choices && (
            <button
              className="next"
              onClick={(e) => {
                e.stopPropagation();
                onNext();
              }}
            >
              <span>Next</span>
              <ArrowRight size={13} strokeWidth={3} />
            </button>
          )}
        </div>
        {d.choices && done && (
          <div className="choices">
            <div className="choices-label">
              <MessageCircle size={12} strokeWidth={2.5} />
              <span>What would you like to say?</span>
            </div>
            {d.choices.map((c, i) => (
              <button key={i} className={`choice ${i === d.choices!.length - 1 ? "exit" : ""}`} style={{ animationDelay: `${i * 70}ms` }} onClick={() => onChoose(i)}>
                <i>{i + 1}</i>
                <span>{c.label}</span>
                {c.seen && (
                  <em>
                    <Check size={15} strokeWidth={3.5} />
                  </em>
                )}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function Polaroid({ memory, count, total, onClose }: { memory: (typeof MEMORIES)[number]; count: number; total: number; onClose: () => void }) {
  const [broken, setBroken] = useState(false);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" || e.key === "Enter") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);
  return (
    <div className="modal" onClick={onClose}>
      <div className="sparkles" aria-hidden>
        {Array.from({ length: 14 }, (_, i) => (
          <span key={i} style={{ left: `${(i * 29) % 100}%`, animationDelay: `${(i * 0.37) % 4}s` }}>
            {i % 2 ? "✨" : "💖"}
          </span>
        ))}
      </div>
      <div className="polaroid" onClick={(e) => e.stopPropagation()}>
        <div className="tape" />
        <button className="polaroid-close" onClick={onClose} aria-label="Close memory">
          <X size={16} strokeWidth={2.75} />
        </button>
        <div className="polaroid-tag">
          <span>{memory.tag}</span>
          <span className="tag-divider" />
          <span>
            {count}/{total}
          </span>
        </div>
        <div className="photo-frame">
          {broken ? (
            <div className="photo-fallback">
              {memory.status === "on-the-way" ? <Package size={44} strokeWidth={1.5} /> : <HeartHandshake size={44} strokeWidth={1.5} />}
            </div>
          ) : (
            <img
              src={memory.photo}
              alt={memory.title}
              onError={() => setBroken(true)}
              draggable={false}
              style={memory.focus ? { objectPosition: memory.focus } : undefined}
            />
          )}
          {memory.status === "on-the-way" && (
            <div className="photo-ribbon">
              <Plane size={13} strokeWidth={2.5} />
              <span>Still on its way</span>
            </div>
          )}
        </div>
        <h2>{memory.title}</h2>
        <div className="brand-line">
          {COLLECTION.brand} · {COLLECTION.label}
        </div>
        <p>{memory.caption}</p>
        <button className="btn-pink" onClick={onClose}>
          <span>Keep exploring</span>
          <Compass size={16} strokeWidth={2.5} />
        </button>
      </div>
    </div>
  );
}

function Finale({ onClose }: { onClose: () => void }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const c = ref.current;
    if (!c) return;
    const g = c.getContext("2d")!;
    let raf = 0;
    const resize = () => {
      c.width = window.innerWidth;
      c.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);
    type P = { x: number; y: number; vx: number; vy: number; life: number; col: string; heart: boolean };
    let ps: P[] = [];
    let t = 0;
    let nextBurst = 0;
    let last = performance.now();
    const cols = ["#ff3b6b", "#ffd84d", "#ff9ec4", "#8fd8ff", "#ffffff", "#c79bff"];
    const burst = () => {
      const cx = c.width * (0.15 + Math.random() * 0.7);
      const cy = c.height * (0.12 + Math.random() * 0.35);
      const col = cols[Math.floor(Math.random() * cols.length)];
      const heart = Math.random() < 0.5;
      const n = 46;
      for (let i = 0; i < n; i++) {
        const a = (i / n) * Math.PI * 2;
        let vx = Math.cos(a);
        let vy = Math.sin(a);
        if (heart) {
          vx = 16 * Math.sin(a) ** 3;
          vy = -(13 * Math.cos(a) - 5 * Math.cos(2 * a) - 2 * Math.cos(3 * a) - Math.cos(4 * a));
          vx /= 16;
          vy /= 16;
        }
        const sp = heart ? 190 : 120 + Math.random() * 90;
        ps.push({ x: cx, y: cy, vx: vx * sp, vy: vy * sp, life: 1.6 + Math.random() * 0.5, col, heart: false });
      }
    };
    const loop = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      t += dt;
      if (t > nextBurst) {
        burst();
        nextBurst = t + 0.8 + Math.random() * 0.7;
      }
      g.globalCompositeOperation = "destination-out";
      g.fillStyle = "rgba(0,0,0,0.22)";
      g.fillRect(0, 0, c.width, c.height);
      g.globalCompositeOperation = "lighter";
      for (const p of ps) {
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.vx *= 0.985;
        p.vy = p.vy * 0.985 + 60 * dt;
        p.life -= dt;
        g.globalAlpha = Math.max(0, Math.min(1, p.life));
        g.fillStyle = p.col;
        g.beginPath();
        g.arc(p.x, p.y, 2.4, 0, Math.PI * 2);
        g.fill();
      }
      g.globalAlpha = 1;
      ps = ps.filter((p) => p.life > 0);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, []);
  return (
    <div className="finale">
      <canvas ref={ref} className="finale-fx" />
      <div className="note-wrap">
        <article className="note">
          <span className="note-tape" aria-hidden />
          <header className="note-head">
            <div className="note-kicker">
              <span>Loveberry Village</span>
              <span className="note-dot" />
              <span>
                <NumberFlow value={MONTHS} /> months
              </span>
            </div>
            <h2>{FINALE.title}</h2>
          </header>
          <div className="note-body">
            {FINALE.letter.map((l, i) => {
              const signature = l.startsWith("—");
              const salutation = !signature && l.endsWith(",") && l.split(" ").length <= 3;
              return (
                <p
                  key={i}
                  className={signature ? "signature" : salutation ? "salutation" : undefined}
                  style={{ animationDelay: `${0.45 + i * 0.85}s` }}
                >
                  <span>{signature ? l.replace("—", "").trim() : l}</span>
                  {signature && <Heart size={15} strokeWidth={0} fill="currentColor" />}
                </p>
              );
            })}
          </div>
          <footer className="note-foot">
            <button className="btn-pink" style={{ animationDelay: `${0.45 + FINALE.letter.length * 0.85}s` }} onClick={onClose}>
              <ArrowLeft size={16} strokeWidth={2.5} />
              <span>Back to the village</span>
            </button>
          </footer>
          <div className="note-seal" aria-hidden>
            <Heart size={18} strokeWidth={0} fill="currentColor" />
          </div>
        </article>
      </div>
    </div>
  );
}
