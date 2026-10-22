import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";
import type { Role } from "../../shared/data";
import { CHARACTERS, ROLES, rolesForSize } from "../../shared/data";
import { Icon, ROLE_COLOR, haptic, spring } from "../ui";
import Avatar from "./Avatar";

type Props = {
  topicTitle: string;
  size: number;
  cast: number[]; // 役割 index → キャラクター index
  seed: number; // シャッフルのたびに変わる
  onShuffle: () => void;
  onStart: () => void;
  onBack: () => void;
};

const ALL_ROLES = Object.values(ROLES);

// スロットマシン風に役割名を回してから確定させる
function RoleSlot({ role, delay, seed }: { role: Role; delay: number; seed: number }) {
  const [spin, setSpin] = useState<Role | null>(ALL_ROLES[0]);
  useEffect(() => {
    let n = 0;
    setSpin(ALL_ROLES[0]);
    const iv = setInterval(() => setSpin(ALL_ROLES[++n % ALL_ROLES.length]), 80);
    const to = setTimeout(() => {
      clearInterval(iv);
      setSpin(null);
      haptic(12);
    }, delay);
    return () => {
      clearInterval(iv);
      clearTimeout(to);
    };
  }, [delay, seed]);
  const shown = spin ?? role;
  return (
    <motion.div
      className="role-badge"
      animate={{ background: spin ? "#c5ccda" : ROLE_COLOR[role.key], scale: spin ? 1 : [1.2, 1] }}
      transition={{ duration: 0.25 }}
    >
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.span
          key={shown.key + String(!!spin)}
          style={{ display: "block" }}
          initial={{ y: 14, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -14, opacity: 0 }}
          transition={{ duration: spin ? 0.06 : 0.2 }}
        >
          {shown.name}
        </motion.span>
      </AnimatePresence>
    </motion.div>
  );
}

export default function RoleAssign({ topicTitle, size, cast, seed, onShuffle, onStart, onBack }: Props) {
  const roles = rolesForSize(size);
  return (
    <motion.div
      className="screen"
      initial={{ opacity: 0, x: 60 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, y: -60, filter: "blur(6px)" }}
      transition={spring}
      onPanEnd={(_, info) => {
        if (info.offset.y < -90 && Math.abs(info.offset.y) > Math.abs(info.offset.x)) onStart();
        else if (info.offset.x > 110 && Math.abs(info.offset.x) > Math.abs(info.offset.y)) onBack();
      }}
      style={{ touchAction: "none" }}
      data-testid="roles-screen"
    >
      <div className="demo-top">
        <motion.button className="glass icon-btn" whileTap={{ scale: 0.9 }} onClick={onBack} aria-label="戻る" data-testid="roles-back">
          <Icon.Prev />
        </motion.button>
        <div className="demo-title">
          <b>{topicTitle}</b>
          <span>{size}人</span>
        </div>
      </div>

      <div className="roles-head">
        <small>ROLE</small>
        <h2>役割分担</h2>
      </div>

      <div className={`role-grid${size > 4 ? " compact" : ""}`}>
        {roles.map((r, i) => {
          const c = CHARACTERS[cast[i]];
          return (
            <motion.div
              key={`${seed}-${i}`}
              className="glass role-card"
              initial={{ opacity: 0, y: 30, scale: 0.9, rotateX: 30 }}
              animate={{ opacity: 1, y: 0, scale: 1, rotateX: 0 }}
              transition={{ ...spring, delay: i * 0.07 }}
              style={{ transformPerspective: 600 }}
              data-testid={`role-card-${i}`}
            >
              <motion.div initial={{ scale: 0.5 }} animate={{ scale: 1 }} transition={{ ...spring, delay: 0.1 + i * 0.07 }}>
                <Avatar c={c} size={size > 4 ? 46 : 58} />
              </motion.div>
              <span className="name">{c.name}</span>
              <RoleSlot role={r} delay={650 + i * 170} seed={seed} />
              <span className="role-duty">{r.duty}</span>
            </motion.div>
          );
        })}
      </div>

      <div className="roles-actions">
        <motion.button className="glass secondary" whileTap={{ scale: 0.94, rotate: -8 }} onClick={onShuffle} aria-label="シャッフル" data-testid="shuffle">
          <Icon.Shuffle />
        </motion.button>
        <motion.button className="primary" whileTap={{ scale: 0.96 }} onClick={onStart} data-testid="start-demo">
          <Icon.Play size={18} />
          デモを見る
        </motion.button>
      </div>
      <motion.div className="swipe-hint" animate={{ y: [0, -5, 0] }} transition={{ duration: 1.6, repeat: Infinity }}>
        <Icon.ChevronUp size={18} />
      </motion.div>
    </motion.div>
  );
}
