import { AnimatePresence, animate, motion, useMotionValue, useTransform, type MotionValue } from "motion/react";
import { useRef, useState } from "react";
import type { GdType, Topic } from "../../shared/data";
import { GD_TYPES } from "../../shared/data";
import { Icon, haptic, spring } from "../ui";

type Props = {
  views: Record<string, number>;
  typeIndex: number;
  onTypeIndex: (i: number) => void;
  onPick: (type: GdType, topic: Topic) => void;
};

function TypeCard({ type, i, pos, onTap }: { type: GdType; i: number; pos: MotionValue<number>; onTap: () => void }) {
  const d = useTransform(pos, (p) => i - p);
  const x = useTransform(d, (v) => `${v * 84}%`);
  const scale = useTransform(d, (v) => 1 - Math.min(Math.abs(v), 2) * 0.12);
  const rotate = useTransform(d, (v) => Math.max(-2, Math.min(2, v)) * 3);
  const opacity = useTransform(d, (v) => 1 - Math.min(Math.abs(v), 2) * 0.35);
  const zIndex = useTransform(d, (v) => 10 - Math.round(Math.abs(v) * 2));
  return (
    <motion.div
      className="glass type-card"
      style={{ x, scale, rotate, opacity, zIndex }}
      onTap={onTap}
      data-testid={`type-card-${type.id}`}
    >
      <div className="tint" style={{ background: `linear-gradient(135deg, hsla(${type.hue},90%,85%,0.9), hsla(${type.hue + 40},90%,92%,0.4))` }} />
      <svg className="type-icon" width="140" height="140" viewBox="0 0 140 140" aria-hidden>
        <circle cx="90" cy="90" r="50" fill={`hsla(${type.hue},85%,70%,0.35)`} />
        <circle cx="50" cy="104" r="28" fill={`hsla(${type.hue + 30},85%,75%,0.35)`} />
        <circle cx="104" cy="40" r="18" fill="rgba(255,255,255,0.7)" />
      </svg>
      <span className="num">{String(i + 1).padStart(2, "0")} / {String(GD_TYPES.length).padStart(2, "0")}</span>
      <h2>{type.name}</h2>
      <div className="tags">
        {type.tags.map((t) => (
          <span key={t} className="tag" style={{ color: `hsl(${type.hue},60%,38%)` }}>{t}</span>
        ))}
      </div>
    </motion.div>
  );
}

export default function Home({ views, typeIndex, onTypeIndex, onPick }: Props) {
  const pos = useMotionValue(typeIndex);
  const start = useRef(typeIndex);
  const width = useRef(300);
  const [dir, setDir] = useState(1);
  const type = GD_TYPES[typeIndex];

  function go(i: number) {
    const next = Math.max(0, Math.min(GD_TYPES.length - 1, i));
    if (next !== typeIndex) {
      setDir(next > typeIndex ? 1 : -1);
      haptic();
    }
    onTypeIndex(next);
    animate(pos, next, spring);
  }

  return (
    <motion.div
      className="screen"
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.96, filter: "blur(6px)" }}
      transition={{ duration: 0.3 }}
    >
      <div className="topbar">
        <span className="brand">GDデモ</span>
      </div>

      <motion.div
        className="carousel"
        ref={(el) => {
          if (el) width.current = el.offsetWidth * 0.84;
        }}
        onPanStart={() => {
          pos.stop();
          start.current = pos.get();
        }}
        onPan={(_, info) => {
          const raw = start.current - info.offset.x / width.current;
          // 端ではゴムのように抵抗をつける
          const max = GD_TYPES.length - 1;
          pos.set(raw < 0 ? raw * 0.3 : raw > max ? max + (raw - max) * 0.3 : raw);
        }}
        onPanEnd={(_, info) => {
          const projected = start.current - (info.offset.x + info.velocity.x * 0.25) / width.current;
          const target = Math.round(Math.max(start.current - 1, Math.min(start.current + 1, projected)));
          go(target);
        }}
        data-testid="carousel"
      >
        {GD_TYPES.map((t, i) => (
          <TypeCard key={t.id} type={t} i={i} pos={pos} onTap={() => go(i)} />
        ))}
      </motion.div>

      <div className="dots">
        {GD_TYPES.map((t, i) => (
          <motion.button
            key={t.id}
            className="dot"
            aria-label={t.name}
            animate={{ width: i === typeIndex ? 18 : 6, background: i === typeIndex ? `hsl(${type.hue},70%,55%)` : "rgba(29,36,51,0.18)" }}
            transition={spring}
            onClick={() => go(i)}
          />
        ))}
      </div>

      <div className="topics">
        <AnimatePresence mode="popLayout" initial={false} custom={dir}>
          <motion.div
            key={type.id}
            custom={dir}
            style={{ display: "flex", flexDirection: "column", gap: 12 }}
            initial="enter"
            animate="center"
            exit="exit"
            variants={{
              enter: (d: number) => ({ opacity: 0, x: d * 60 }),
              center: { opacity: 1, x: 0, transition: { staggerChildren: 0.06 } },
              exit: (d: number) => ({ opacity: 0, x: d * -60, transition: { duration: 0.18 } }),
            }}
          >
            {type.topics.map((topic, i) => (
              <motion.button
                key={topic.id}
                className="glass topic-card"
                variants={{ enter: { opacity: 0, y: 18 }, center: { opacity: 1, y: 0, transition: spring } }}
                whileTap={{ scale: 0.97 }}
                onClick={() => {
                  haptic();
                  onPick(type, topic);
                }}
                data-testid={`topic-${topic.id}`}
              >
                <span className="topic-no" style={{ background: `linear-gradient(160deg, hsl(${type.hue},85%,66%), hsl(${type.hue + 25},80%,58%))` }}>
                  {i + 1}
                </span>
                <span className="topic-title">{topic.title}</span>
                {views[topic.id] ? (
                  <span className="seen"><Icon.Check size={13} />視聴済み</span>
                ) : (
                  <span className="chev"><Icon.Next size={18} /></span>
                )}
              </motion.button>
            ))}
          </motion.div>
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
