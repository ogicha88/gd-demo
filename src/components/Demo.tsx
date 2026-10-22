import { AnimatePresence, motion } from "motion/react";
import { useEffect, useMemo, useRef, useState } from "react";
import type { Script } from "../../shared/data";
import { CHARACTERS, PHASES, TOTAL_MINUTES, rolesForSize } from "../../shared/data";
import { Icon, ROLE_COLOR, haptic, spring } from "../ui";
import Avatar from "./Avatar";

type Props = {
  script: Script;
  topicTitle: string;
  cast: number[];
  onExit: () => void;
  onFinish: () => void;
};

const TYPE_MS = 32; // 1 文字あたりのタイピング時間
const READ_MS = 45; // 1 文字あたりの読む時間
const LINE_GAP_MS = 700;
const BANNER_MS = 1300;
const SPEEDS = [1, 1.5, 2];

function fmt(sec: number) {
  const s = Math.max(0, Math.round(sec));
  return `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
}

export default function Demo({ script, topicTitle, cast, onExit, onFinish }: Props) {
  const { lines } = script;
  const roles = rolesForSize(script.size);
  const [idx, setIdx] = useState(0);
  const [typed, setTyped] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [speed, setSpeed] = useState(1);
  const [banner, setBanner] = useState(true);
  const [boardOpen, setBoardOpen] = useState(false);
  const chatRef = useRef<HTMLDivElement>(null);
  const line = lines[idx];
  const done = typed >= line.t.length;
  const active = playing && !boardOpen;

  // フェーズが変わったらバナーを出す
  useEffect(() => {
    if (idx === 0 || lines[idx - 1].p !== line.p) setBanner(true);
  }, [idx]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!banner || !active) return;
    const t = setTimeout(() => setBanner(false), BANNER_MS / speed);
    return () => clearTimeout(t);
  }, [banner, active, speed]);

  // タイピング → 読む時間 → 次の発言
  useEffect(() => {
    if (!active || banner) return;
    if (!done) {
      const t = setTimeout(() => setTyped((n) => n + 1), TYPE_MS / speed);
      return () => clearTimeout(t);
    }
    const t = setTimeout(
      () => {
        if (idx < lines.length - 1) {
          setIdx(idx + 1);
          setTyped(0);
        } else {
          onFinish();
        }
      },
      (LINE_GAP_MS + line.t.length * READ_MS) / speed,
    );
    return () => clearTimeout(t);
  }, [active, banner, done, typed, idx, speed]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const el = chatRef.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: typed === 0 ? "smooth" : "auto" });
  }, [idx, typed]);

  // デスクトップ用のキーボード操作
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === " ") {
        e.preventDefault();
        setPlaying((p) => !p);
      } else if (e.key === "ArrowRight") step(1);
      else if (e.key === "ArrowLeft") step(-1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  function step(d: number) {
    const next = idx + d;
    if (next < 0) return;
    if (next >= lines.length) {
      onFinish();
      return;
    }
    haptic();
    setBanner(false);
    setIdx(next);
    setTyped(d > 0 ? 0 : lines[next].t.length);
  }

  // 模擬タイマー（20 分のGDを圧縮して表示）
  const remaining = useMemo(() => {
    const inPhase = lines.filter((l) => l.p === line.p);
    const pos = inPhase.indexOf(line) + typed / Math.max(1, line.t.length);
    const before = PHASES.slice(0, line.p).reduce((a, p) => a + p.minutes, 0);
    const elapsed = before + (pos / inPhase.length) * PHASES[line.p].minutes;
    return (TOTAL_MINUTES - elapsed) * 60;
  }, [line, typed, lines]);

  const phaseProgress = (p: number) => {
    if (p < line.p) return 1;
    if (p > line.p) return 0;
    const inPhase = lines.filter((l) => l.p === p);
    return (inPhase.indexOf(line) + (done ? 1 : typed / line.t.length)) / inPhase.length;
  };

  const notes = lines
    .slice(0, idx + 1)
    .map((l, i) => ({ ...l, i }))
    .filter((l) => l.note && (l.i < idx || done));

  const seats = cast.map((_, i) => {
    const a = (-90 + (360 / cast.length) * i) * (Math.PI / 180);
    return { x: 50 + 40 * Math.cos(a), y: 48 + 34 * Math.sin(a) };
  });

  return (
    <motion.div
      className="screen demo"
      initial={{ opacity: 0, y: 60 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.96 }}
      transition={spring}
      data-testid="demo-screen"
    >
      <div className="demo-top">
        <motion.button className="glass icon-btn" whileTap={{ scale: 0.9 }} onClick={onExit} aria-label="閉じる" data-testid="demo-close">
          <Icon.Close />
        </motion.button>
        <div className="demo-title">
          <b>{topicTitle}</b>
          <span>{script.size}人</span>
        </div>
        <div className="glass clock" data-testid="clock">{fmt(remaining)}</div>
      </div>

      <div className="phasebar">
        {PHASES.map((p, i) => (
          <div className="phase-seg" key={p.name}>
            <motion.div animate={{ width: `${phaseProgress(i) * 100}%` }} transition={{ duration: 0.25 }} />
          </div>
        ))}
      </div>
      <div className="phase-name">
        <AnimatePresence mode="wait">
          <motion.span key={line.p} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} data-testid="phase-name">
            {line.p + 1}. {PHASES[line.p].name}
          </motion.span>
        </AnimatePresence>
        <span>{idx + 1} / {lines.length}</span>
      </div>

      <motion.div
        style={{ display: "contents" }}
        onPanEnd={(_, info) => {
          if (Math.abs(info.offset.x) > 50 && Math.abs(info.offset.x) > Math.abs(info.offset.y) * 1.3) step(info.offset.x < 0 ? 1 : -1);
        }}
      >
        <motion.div
          className="stage"
          onTap={() => {
            haptic();
            setPlaying((p) => !p);
          }}
          data-testid="stage"
        >
          <div className="glass table" />
          {cast.map((ci, i) => {
            const speaking = line.s === i && !banner;
            return (
              <motion.div
                key={i}
                className="seat"
                style={{ left: `${seats[i].x}%`, top: `${seats[i].y}%`, zIndex: speaking ? 3 : 1 }}
                animate={{ scale: speaking ? 1.16 : 1 }}
                transition={spring}
              >
                <AnimatePresence>
                  {speaking && (
                    <motion.div
                      className="halo"
                      style={{ background: `radial-gradient(circle, ${ROLE_COLOR[roles[i].key]}55 0%, transparent 70%)` }}
                      initial={{ opacity: 0, scale: 0.5 }}
                      animate={{ opacity: [0.6, 1, 0.6], scale: [1, 1.15, 1] }}
                      exit={{ opacity: 0, scale: 0.5 }}
                      transition={{ duration: 1.4, repeat: Infinity }}
                    />
                  )}
                </AnimatePresence>
                <Avatar c={CHARACTERS[ci]} size={46} talking={speaking && !done && active} dim={!speaking} />
                <span className="seat-role" style={{ background: ROLE_COLOR[roles[i].key] }}>
                  {roles[i].short}
                </span>
              </motion.div>
            );
          })}

          <AnimatePresence>
            {banner && (
              <motion.div className="phase-banner" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <motion.div
                  className="glass"
                  initial={{ scale: 0.7, y: 10 }}
                  animate={{ scale: 1, y: 0 }}
                  exit={{ scale: 1.1, opacity: 0 }}
                  transition={spring}
                  data-testid="phase-banner"
                >
                  <small>PHASE {line.p + 1}</small>
                  <b>{PHASES[line.p].name}</b>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {!playing && (
              <motion.div
                className="phase-banner"
                initial={{ opacity: 0, scale: 0.6 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.3 }}
                transition={spring}
              >
                <div className="glass" style={{ padding: 16, borderRadius: "50%" }}>
                  <Icon.Pause size={28} />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        <div style={{ position: "relative", flex: 1, minHeight: 0, display: "flex" }}>
          <div className="chat" ref={chatRef} style={{ flex: 1 }} data-testid="chat">
            {lines.slice(0, idx + 1).map((l, i) => {
              const c = CHARACTERS[cast[l.s]];
              const role = roles[l.s];
              const current = i === idx;
              if (current && banner) return null;
              return (
                <motion.div
                  key={i}
                  className={`msg${current ? "" : " past"}`}
                  initial={{ opacity: 0, y: 16, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={spring}
                  style={{ originX: 0 }}
                >
                  <div className="msg-av">
                    <Avatar c={c} size={40} />
                  </div>
                  <div className="msg-body">
                    <div className="msg-meta">
                      {c.name}
                      <i style={{ background: ROLE_COLOR[role.key] }}>{role.name}</i>
                    </div>
                    <div className="glass bubble" data-testid={current ? "current-bubble" : undefined}>
                      {current ? l.t.slice(0, typed) : l.t}
                      {current && !done && <span className="caret" />}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>

          <AnimatePresence>
            {line.tip && !banner && typed > 0 && (
              <motion.div
                key={idx}
                className="glass tip"
                style={{ top: 6, left: 0, right: 0 }}
                initial={{ opacity: 0, y: -16, scale: 0.94 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.96 }}
                transition={spring}
                data-testid="tip"
              >
                <span className="tip-icon"><Icon.Bulb size={18} /></span>
                <div>
                  <small>POINT</small>
                  <p>{line.tip}</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>

      <div className="glass controls">
        <motion.button className="ctrl speed" whileTap={{ scale: 0.88 }} onClick={() => setSpeed((s) => SPEEDS[(SPEEDS.indexOf(s) + 1) % SPEEDS.length])} data-testid="speed">
          ×{speed}
        </motion.button>
        <motion.button className="ctrl" whileTap={{ scale: 0.88 }} onClick={() => step(-1)} aria-label="前へ" data-testid="prev">
          <Icon.Prev />
        </motion.button>
        <motion.button className="play" whileTap={{ scale: 0.9 }} onClick={() => setPlaying((p) => !p)} aria-label={playing ? "一時停止" : "再生"} data-testid="play">
          <AnimatePresence mode="wait" initial={false}>
            <motion.span key={String(playing)} initial={{ scale: 0, rotate: -90 }} animate={{ scale: 1, rotate: 0 }} exit={{ scale: 0, rotate: 90 }} transition={{ duration: 0.15 }} style={{ display: "grid" }}>
              {playing ? <Icon.Pause size={26} /> : <Icon.Play size={26} />}
            </motion.span>
          </AnimatePresence>
        </motion.button>
        <motion.button className="ctrl" whileTap={{ scale: 0.88 }} onClick={() => step(1)} aria-label="次へ" data-testid="next">
          <Icon.Next />
        </motion.button>
        <motion.button className="ctrl" whileTap={{ scale: 0.88 }} onClick={() => setBoardOpen(true)} aria-label="ボード" data-testid="board-btn">
          <Icon.Board />
          <AnimatePresence>
            {notes.length > 0 && (
              <motion.span key={notes.length} className="badge" initial={{ scale: 0 }} animate={{ scale: [1.5, 1] }} exit={{ scale: 0 }}>
                {notes.length}
              </motion.span>
            )}
          </AnimatePresence>
        </motion.button>
      </div>

      <AnimatePresence>
        {boardOpen && (
          <>
            <motion.div className="scrim" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setBoardOpen(false)} />
            <motion.div
              className="glass sheet board-sheet"
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={spring}
              drag="y"
              dragConstraints={{ top: 0, bottom: 0 }}
              dragElastic={{ top: 0.05, bottom: 0.8 }}
              onDragEnd={(_, info) => {
                if (info.offset.y > 100 || info.velocity.y > 500) setBoardOpen(false);
              }}
              data-testid="board"
            >
              <div className="grabber" />
              <div className="label">書記のボード</div>
              <div className="board">
                {notes.length === 0 && <div className="empty">まだメモはありません</div>}
                {PHASES.map((p, pi) => {
                  const items = notes.filter((n) => n.p === pi);
                  if (!items.length) return null;
                  return (
                    <div key={p.name}>
                      <div className="board-phase">{pi + 1}. {p.name}</div>
                      {items.map((n, k) => (
                        <motion.div key={n.i} className="note" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ ...spring, delay: k * 0.04 }}>
                          {n.note}
                        </motion.div>
                      ))}
                    </div>
                  );
                })}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
