"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Game, UiState, DialogView } from "@/game/engine";
import { MEMORIES, NPCS, FINALE, MONTHS } from "@/game/config";
import { charSprite } from "@/game/sprites";
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
  const [toast, setToast] = useState<string | null>(null);

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
    setToast(ui.toast.text);
    const t = setTimeout(() => setToast(null), 4200);
    return () => clearTimeout(t);
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

      {ui.phase === "title" && <TitleScreen ready={ready} onStart={begin} />}

      {ui.phase !== "title" && (
        <div className="hud">
          <div className="hud-top">
            <div className="chip">
              <span className="chip-heart">♥</span>
              <span>
                {ui.opened.length}/{ui.total}
              </span>
              <span className="chip-dots">
                {MEMORIES.map((m) => (
                  <i key={m.id} className={ui.opened.includes(m.id) ? "on" : ""} />
                ))}
              </span>
            </div>
            <button className="chip round" onClick={toggleMute} aria-label="toggle sound">
              {muted ? "🔇" : "🎵"}
            </button>
          </div>

          {hint && ui.phase === "play" && !ui.dialog && !ui.photo && (
            <div className="hint">Drag anywhere to walk · tap to travel · bump into villagers to chat 💬</div>
          )}

          {toast && !ui.photo && !ui.finale && <div className="toast">{toast}</div>}

          {ui.near && !ui.dialog && !ui.photo && !ui.finale && (
            <button className="action" onClick={() => gameRef.current?.interact()}>
              {ui.near.label}
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
      <div className="floaters">
        {hearts.map((h, i) => (
          <span key={i} style={{ left: `${h.left}%`, animationDelay: `${h.delay}s`, animationDuration: `${h.dur}s`, fontSize: h.size }}>
            {i % 3 === 0 ? "💗" : i % 3 === 1 ? "🌸" : "💕"}
          </span>
        ))}
      </div>
      <div className="title-card">
        <div className="title-eyebrow">✦ A little village made with love ✦</div>
        <div className="title-num">{MONTHS}</div>
        <div className="title-sub">Monthversary</div>
        <p className="title-copy">For my Princess. Come visit Loveberry Village. Everyone has been waiting for you.</p>
        <button className="title-btn" disabled={!ready} onClick={onStart}>
          {ready ? "Enter the Village ♥" : "Gathering petals…"}
        </button>
        <div className="title-note">🔊 Sound on for the full experience</div>
      </div>
    </div>
  );
}

function Portrait({ id }: { id: string }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const c = ref.current;
    const def = NPCS.find((n) => n.id === id);
    if (!c || !def) return;
    const g = c.getContext("2d")!;
    g.imageSmoothingEnabled = false;
    g.clearRect(0, 0, c.width, c.height);
    const spr = charSprite(def.look, 0, 0, 0, 0);
    g.drawImage(spr, 0, 0, 24, 24, 0, 0, 24, 24);
  }, [id]);
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
            <Portrait id={d.npcId} />
          </div>
          <div className="dlg-name">
            <b>{d.name}</b>
            <span>{d.title}</span>
          </div>
        </div>
        <div className="dlg-text" onClick={click}>
          {d.text.slice(0, n)}
          {!done && <span className="caret" />}
          {done && !d.choices && <span className="next">Next ▶</span>}
        </div>
        {d.choices && done && (
          <div className="choices">
            <div className="choices-label">What would you like to say?</div>
            {d.choices.map((c, i) => (
              <button key={i} className={`choice ${i === d.choices!.length - 1 ? "exit" : ""}`} style={{ animationDelay: `${i * 70}ms` }} onClick={() => onChoose(i)}>
                <i>{i + 1}</i>
                <span>{c.label}</span>
                {c.seen && <em>♥</em>}
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
        <div className="polaroid-tag">
          {memory.tag} · {count}/{total}
        </div>
        <div className="photo-frame">
          {broken ? <div className="photo-fallback">💞</div> : <img src={memory.photo} alt={memory.title} onError={() => setBroken(true)} draggable={false} />}
        </div>
        <h2>{memory.title}</h2>
        <p>{memory.caption}</p>
        <button className="btn-pink" onClick={onClose}>
          Keep exploring ♥
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
      <div className="finale-card">
        <div className="finale-num">{MONTHS}</div>
        <h2>{FINALE.title}</h2>
        <div className="letter">
          {FINALE.letter.map((l, i) => (
            <p key={i} style={{ animationDelay: `${0.6 + i * 1.1}s` }}>
              {l}
            </p>
          ))}
        </div>
        <button className="btn-pink" style={{ animationDelay: `${0.6 + FINALE.letter.length * 1.1}s` }} onClick={onClose}>
          Back to the village ♥
        </button>
      </div>
    </div>
  );
}
