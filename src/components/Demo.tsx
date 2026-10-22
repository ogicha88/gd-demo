import { AnimatePresence, motion } from "motion/react";
import { memo, useEffect, useMemo, useRef, useState, type RefObject } from "react";
import type { Script, ScriptLine } from "../../shared/data";
import { CHARACTERS, PHASES, ROLES, TOTAL_MINUTES } from "../../shared/data";
import { Icon, ROLE_ACTION, haptic, softSpring, spring } from "../ui";
import { useSwipe } from "../useSwipe";
import Avatar from "./Avatar";

type Props = {
  script: Script;
  topicTitle: string;
  onExit: () => void;
  onFinish: () => void;
};

const TYPE_MS = 26; // 1 文字あたりのタイピング時間
const READ_MS = 38; // 1 文字あたりの読む時間
const LINE_GAP_MS = 600;
const BANNER_MS = 1100;
const SPEEDS = [1, 1.5, 2];

function fmt(sec: number) {
  const s = Math.max(0, Math.round(sec));
  return `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
}

// 各話者の役割が何行目で決まるか（決まるまでは役割を表示しない）
function assignIndex(lines: ScriptLine[]) {
  return ROLES.map((_, s) => {
    const i = lines.findIndex((l) => l.s === s && l.assign);
    return i < 0 ? 0 : i;
  });
}

function Meta({ line, assigned }: { line: ScriptLine; assigned: boolean }) {
  const role = ROLES[line.s];
  return (
    <div className="msg-meta">
      {CHARACTERS[line.s].name}
      {assigned && <i style={{ background: role.color }}>{role.name}</i>}
      {line.role && <em style={{ color: role.color }}>{ROLE_ACTION[line.s]}</em>}
    </div>
  );
}

function bubbleStyle(line: ScriptLine) {
  return line.role ? { borderLeftColor: ROLES[line.s].color } : undefined;
}

// 過去の発言（行が進んだときだけ再描画）
const PastMessages = memo(function PastMessages({ lines, upto, assignAt }: { lines: ScriptLine[]; upto: number; assignAt: number[] }) {
  return (
    <>
      {lines.slice(0, upto).map((l, i) => (
        <div key={i} className="msg past">
          <div className="msg-av">
            <Avatar c={CHARACTERS[l.s]} size={40} />
          </div>
          <div className="msg-body">
            <Meta line={l} assigned={assignAt[l.s] <= i} />
            <div className={`bubble${l.role ? " role-line" : ""}${l.key ? " key-line" : ""}`} style={bubbleStyle(l)}>
              {l.t}
            </div>
          </div>
        </div>
      ))}
    </>
  );
});

// 今話している発言（タイピング表示はこの中だけで更新する）
function CurrentMessage({
  line,
  index,
  assigned,
  speed,
  active,
  onDone,
  chatRef,
}: {
  line: ScriptLine;
  index: number;
  assigned: boolean;
  speed: number;
  active: boolean;
  onDone: () => void;
  chatRef: RefObject<HTMLDivElement | null>;
}) {
  const [typed, setTyped] = useState(0);
  const done = typed >= line.t.length;
  useEffect(() => {
    if (done) {
      onDone();
      return;
    }
    if (!active) return;
    const t = setTimeout(() => setTyped((n) => n + 1), TYPE_MS / speed);
    return () => clearTimeout(t);
  }, [typed, active, speed]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    const el = chatRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [typed, chatRef]);

  return (
    <motion.div
      key={index}
      className="msg"
      initial={{ opacity: 0, y: 18, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={spring}
      style={{ originX: 0 }}
    >
      <div className="msg-av">
        <Avatar c={CHARACTERS[line.s]} size={40} />
      </div>
      <div className="msg-body">
        <Meta line={line} assigned={assigned} />
        <div className={`bubble current${line.role ? " role-line" : ""}${line.key ? " key-line" : ""}`} style={bubbleStyle(line)} data-testid="current-bubble">
          {line.t.slice(0, typed)}
          {!done && <span className="caret" style={{ background: ROLES[line.s].color }} />}
        </div>
      </div>
    </motion.div>
  );
}

export default function Demo({ script, topicTitle, onExit, onFinish }: Props) {
  const { lines } = script;
  const [idx, setIdx] = useState(0);
  const [lineDone, setLineDone] = useState(false);
  const [playing, setPlaying] = useState(true);
  const [speed, setSpeed] = useState(1);
  const [banner, setBanner] = useState(true);
  const [keyOpen, setKeyOpen] = useState(false);
  const [boardOpen, setBoardOpen] = useState(false);
  const acked = useRef(new Set<number>());
  const chatRef = useRef<HTMLDivElement>(null);
  const line = lines[idx];
  const role = ROLES[line.s];
  const active = playing && !boardOpen && !keyOpen;
  const assignAt = useMemo(() => assignIndex(lines), [lines]);

  function goTo(next: number, opts: { skipKey?: boolean } = {}) {
    if (next < 0) return;
    if (next >= lines.length) {
      onFinish();
      return;
    }
    if (opts.skipKey) acked.current.add(next);
    setKeyOpen(false);
    setLineDone(false);
    setBanner(lines[next].p !== lines[idx].p);
    setIdx(next);
  }

  // フェーズの切り替わりで出すバナー
  useEffect(() => {
    if (!banner || !active) return;
    const t = setTimeout(() => setBanner(false), BANNER_MS / speed);
    return () => clearTimeout(t);
  }, [banner, active, speed]);

  // 発言を読み終えたら次へ（重要場面なら解説を出して止まる）
  useEffect(() => {
    if (!lineDone || !active) return;
    if (line.key && !acked.current.has(idx)) {
      const t = setTimeout(() => {
        haptic(14);
        setKeyOpen(true);
      }, 350);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => goTo(idx + 1), (LINE_GAP_MS + line.t.length * READ_MS) / speed);
    return () => clearTimeout(t);
  }, [lineDone, active, idx, speed]); // eslint-disable-line react-hooks/exhaustive-deps

  // 解説カードの出し入れでチャット欄の高さが変わるので、最新の発言が見えるようにスクロールし直す
  useEffect(() => {
    const el = chatRef.current;
    if (!el) return;
    const toBottom = () => el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
    const timers = [setTimeout(toBottom, 60), setTimeout(toBottom, 450)];
    return () => timers.forEach(clearTimeout);
  }, [keyOpen]);

  function continueFromKey() {
    acked.current.add(idx);
    haptic();
    goTo(idx + 1);
  }

  function step(d: number) {
    haptic();
    if (d > 0 && keyOpen) return continueFromKey();
    if (d > 0) acked.current.add(idx);
    goTo(idx + d, { skipKey: d < 0 });
  }

  const swipe = useSwipe({ onLeft: () => step(1), onRight: () => step(-1) }, 60);

  // デスクトップ用のキーボード操作
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === " ") {
        e.preventDefault();
        if (keyOpen) continueFromKey();
        else setPlaying((p) => !p);
      } else if (e.key === "ArrowRight" || e.key === "Enter") step(1);
      else if (e.key === "ArrowLeft") step(-1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  // 模擬タイマー（20 分の GD を圧縮して表示）
  const remaining = useMemo(() => {
    const inPhase = lines.filter((l) => l.p === line.p);
    const pos = inPhase.indexOf(line) + (lineDone ? 1 : 0.5);
    const before = PHASES.slice(0, line.p).reduce((a, p) => a + p.minutes, 0);
    return (TOTAL_MINUTES - before - (pos / inPhase.length) * PHASES[line.p].minutes) * 60;
  }, [line, lineDone, lines]);

  const phaseProgress = (p: number) => {
    if (p !== line.p) return p < line.p ? 1 : 0;
    const inPhase = lines.filter((l) => l.p === p);
    return (inPhase.indexOf(line) + (lineDone ? 1 : 0.5)) / inPhase.length;
  };

  const notes = lines.slice(0, idx + 1).flatMap((l, i) => (l.note && (i < idx || lineDone) ? [{ ...l, i }] : []));
  const speaking = (s: number) => line.s === s && !banner;

  return (
    <motion.div
      className="screen demo"
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.97 }}
      transition={softSpring}
      data-testid="demo-screen"
      data-key-open={keyOpen ? "1" : "0"}
    >
      <motion.div
        className="tint-layer"
        initial={false}
        animate={{ opacity: keyOpen ? 1 : 0, backgroundColor: role.tint }}
        transition={{ duration: 0.45 }}
      />

      <div className="demo-top">
        <motion.button className="glass icon-btn" whileTap={{ scale: 0.9 }} onClick={onExit} aria-label="閉じる" data-testid="demo-close">
          <Icon.Close />
        </motion.button>
        <div className="demo-title">
          <b>{topicTitle}</b>
        </div>
        <div className="glass clock" data-testid="clock">{fmt(remaining)}</div>
      </div>

      <div className="phasebar">
        {PHASES.map((p, i) => (
          <div className="phase-seg" key={p.name}>
            <motion.div animate={{ scaleX: phaseProgress(i) }} transition={{ duration: 0.4 }} />
          </div>
        ))}
      </div>
      <div className="phase-name">
        <AnimatePresence mode="wait" initial={false}>
          <motion.span key={line.p} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} data-testid="phase-name">
            {PHASES[line.p].name}
          </motion.span>
        </AnimatePresence>
        <span data-testid="counter">{idx + 1} / {lines.length}</span>
      </div>

      <div
        className="glass seats"
        onClick={() => {
          if (keyOpen) return;
          haptic();
          setPlaying((p) => !p);
        }}
        data-testid="stage"
      >
        {ROLES.map((r, s) => {
          const assigned = assignAt[s] < idx || (assignAt[s] === idx && lineDone);
          const on = speaking(s);
          return (
            <motion.div key={s} className={`seat${on ? " on" : ""}`} animate={{ y: on ? -4 : 0, scale: on ? 1.08 : 1 }} transition={spring}>
              <span className="seat-ring" style={{ borderColor: r.color, opacity: on ? 1 : 0 }} />
              <Avatar c={CHARACTERS[s]} size={44} talking={on && !lineDone && active} />
              <AnimatePresence mode="popLayout" initial={false}>
                {assigned ? (
                  <motion.span
                    key="role"
                    className="seat-role"
                    style={{ background: r.color }}
                    initial={{ scale: 0.3, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: "spring", stiffness: 500, damping: 18 }}
                  >
                    {r.short}
                  </motion.span>
                ) : (
                  <motion.span key="none" className="seat-role none" exit={{ scale: 0.3, opacity: 0 }}>
                    ？
                  </motion.span>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}

        <AnimatePresence>
          {banner && (
            <motion.div
              className="phase-pill"
              initial={{ opacity: 0, y: 10, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={spring}
              data-testid="phase-banner"
            >
              <small>PHASE {line.p + 1}</small>
              {PHASES[line.p].name}
            </motion.div>
          )}
          {!playing && !banner && (
            <motion.div className="phase-pill" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 1.1 }} transition={spring}>
              <Icon.Pause size={18} />
              一時停止中
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="chat" ref={chatRef} {...swipe} data-testid="chat">
        <PastMessages lines={lines} upto={idx} assignAt={assignAt} />
        {!banner && (
          <CurrentMessage
            key={idx}
            line={line}
            index={idx}
            assigned={assignAt[line.s] < idx || (assignAt[line.s] === idx && lineDone)}
            speed={speed}
            active={active}
            onDone={() => setLineDone(true)}
            chatRef={chatRef}
          />
        )}
      </div>

      <AnimatePresence mode="wait" initial={false}>
        {keyOpen && line.key ? (
          <motion.div
            key={`key-${idx}`}
            className="key-card"
            style={{ "--role": role.color } as React.CSSProperties}
            initial={{ opacity: 0, y: 40, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.97 }}
            transition={softSpring}
            data-testid="key-card"
          >
            <div className="key-head">
              <span className="key-role" style={{ background: role.color }}>{role.name}のポイント</span>
            </div>
            <motion.h4 initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 }}>
              {line.key.title}
            </motion.h4>
            <motion.p initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.22 }}>
              {line.key.why}
            </motion.p>
            <motion.button
              className="key-next"
              style={{ background: role.color }}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              whileTap={{ scale: 0.96 }}
              onClick={continueFromKey}
              data-testid="key-next"
            >
              続きを見る
              <Icon.Next size={18} />
            </motion.button>
          </motion.div>
        ) : (
          <motion.div
            key="controls"
            className="glass controls"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={spring}
          >
            <motion.button className="ctrl speed" whileTap={{ scale: 0.88 }} onClick={() => setSpeed((s) => SPEEDS[(SPEEDS.indexOf(s) + 1) % SPEEDS.length])} data-testid="speed">
              ×{speed}
            </motion.button>
            <motion.button className="ctrl" whileTap={{ scale: 0.88 }} onClick={() => step(-1)} aria-label="前へ" data-testid="prev">
              <Icon.Prev />
            </motion.button>
            <motion.button className="play" whileTap={{ scale: 0.9 }} onClick={() => setPlaying((p) => !p)} aria-label={playing ? "一時停止" : "再生"} data-testid="play">
              {playing ? <Icon.Pause size={26} /> : <Icon.Play size={26} />}
            </motion.button>
            <motion.button className="ctrl" whileTap={{ scale: 0.88 }} onClick={() => step(1)} aria-label="次へ" data-testid="next">
              <Icon.Next />
            </motion.button>
            <motion.button className="ctrl" whileTap={{ scale: 0.88 }} onClick={() => setBoardOpen(true)} aria-label="書記のボード" data-testid="board-btn">
              <Icon.Board />
              {notes.length > 0 && (
                <span className="badge">
                  {/* メモが増えるたびに数字だけ弾ませる */}
                  <motion.span key={notes.length} initial={{ scale: 1.8 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 600, damping: 15 }}>
                    {notes.length}
                  </motion.span>
                </span>
              )}
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {boardOpen && (
          <>
            <motion.div className="scrim" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setBoardOpen(false)} />
            <motion.div
              className="sheet board-sheet"
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={spring}
              drag="y"
              dragConstraints={{ top: 0, bottom: 0 }}
              dragElastic={{ top: 0.05, bottom: 0.8 }}
              onDragEnd={(_, info) => {
                if (info.offset.y > 80 || info.velocity.y > 400) setBoardOpen(false);
              }}
              data-testid="board"
            >
              <div className="grabber" />
              <div className="label" style={{ color: ROLES[2].color }}>書記のボード</div>
              <div className="board">
                {notes.length === 0 && <div className="empty">まだメモはありません</div>}
                {PHASES.map((p, pi) => {
                  const items = notes.filter((n) => n.p === pi);
                  if (!items.length) return null;
                  return (
                    <div key={p.name}>
                      <div className="board-phase">{p.name}</div>
                      {items.map((n, k) => (
                        <motion.div key={n.i} className="note" initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} transition={{ ...spring, delay: k * 0.03 }}>
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
