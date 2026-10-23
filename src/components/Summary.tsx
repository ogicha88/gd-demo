import { motion } from "motion/react";
import { useState } from "react";
import type { Script } from "../../shared/data";
import { CHARACTERS, PHASES, ROLES } from "../../shared/data";
import { Icon, spring } from "../ui";
import Avatar from "./Avatar";

type Props = {
  script: Script;
  topicTitle: string;
  onReplay: () => void;
  onHome: () => void;
  onGuide: () => void;
};

const item = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: spring },
};

export default function Summary({ script, topicTitle, onReplay, onHome, onGuide }: Props) {
  const roleKeys = ROLES.map((r, s) => ({ role: r, s, keys: script.lines.filter((l) => l.s === s && l.key).map((l) => l.key!) })).filter(
    (g) => g.keys.length > 0,
  );
  const [tab, setTab] = useState(roleKeys[0]?.s ?? 0);
  const current = roleKeys.find((g) => g.s === tab) ?? roleKeys[0];

  return (
    <motion.div
      className="screen summary"
      initial="hidden"
      animate="show"
      exit={{ opacity: 0, y: 40 }}
      variants={{ show: { transition: { staggerChildren: 0.07 } } }}
      data-testid="summary-screen"
    >
      <motion.div className="glass summary-hero" variants={item}>
        <div className="hero-people">
          {CHARACTERS.map((c, i) => (
            <motion.div key={c.name} animate={{ y: [0, -14, 0] }} transition={{ delay: 0.35 + i * 0.07, duration: 0.5 }}>
              <Avatar c={c} size={40} />
            </motion.div>
          ))}
        </div>
        <small>CONCLUSION</small>
        <h2>{topicTitle}</h2>
        <p data-testid="conclusion">{script.conclusion}</p>
      </motion.div>

      {current && (
        <motion.div className="glass section" variants={item}>
          <h3>役割ごとのポイント</h3>
          <div className="role-tabs">
            {roleKeys.map((g) => (
              <button
                key={g.s}
                className={g.s === tab ? "on" : ""}
                style={g.s === tab ? { background: g.role.color, color: "#fff" } : { color: g.role.color }}
                onClick={() => setTab(g.s)}
                data-testid={`role-tab-${g.s}`}
              >
                {g.role.name}
              </button>
            ))}
          </div>
          <motion.ul key={tab} className="points" initial="hidden" animate="show" variants={{ show: { transition: { staggerChildren: 0.05 } } }}>
            {current.keys.map((k, i) => (
              <motion.li key={i} variants={item} style={{ "--role": current.role.color } as React.CSSProperties}>
                <b>{k.title}</b>
                <span>{k.why}</span>
              </motion.li>
            ))}
          </motion.ul>
        </motion.div>
      )}

      <motion.div className="glass section" variants={item}>
        <h3>議論の流れ</h3>
        <div className="flow">
          {PHASES.map((p, i) => {
            const notes = script.lines.filter((l) => l.p === i && l.note).map((l) => l.note!);
            return (
              <div className="flow-item" key={p.name}>
                <b>{p.name}</b>
                <span>{p.minutes}分</span>
                {notes.length > 0 && <p>{notes.join(" ／ ")}</p>}
              </div>
            );
          })}
        </div>
      </motion.div>

      <motion.div className="summary-actions" variants={item}>
        <motion.button className="primary" whileTap={{ scale: 0.96 }} onClick={onReplay} data-testid="replay">
          <Icon.Replay size={18} />
          もう一度見る
        </motion.button>
        <div className="row">
          <motion.button className="glass secondary" whileTap={{ scale: 0.96 }} onClick={onGuide} data-testid="summary-guide">
            <Icon.Book size={18} />
            GDの基本
          </motion.button>
          <motion.button className="glass secondary" whileTap={{ scale: 0.96 }} onClick={onHome} data-testid="home">
            <Icon.Home size={18} />
            お題一覧へ
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  );
}
