import { motion } from "motion/react";
import type { Script } from "../../shared/data";
import { CHARACTERS, PHASES } from "../../shared/data";
import { Icon, spring } from "../ui";
import Avatar from "./Avatar";

type Props = {
  script: Script;
  topicTitle: string;
  cast: number[];
  onReplay: () => void;
  onChangeSize: () => void;
  onHome: () => void;
};

const item = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: spring },
};

export default function Summary({ script, topicTitle, cast, onReplay, onChangeSize, onHome }: Props) {
  const tips = script.lines.filter((l) => l.tip).map((l) => l.tip!);
  return (
    <motion.div
      className="screen summary"
      initial="hidden"
      animate="show"
      exit={{ opacity: 0, y: 40 }}
      variants={{ show: { transition: { staggerChildren: 0.08 } } }}
      data-testid="summary-screen"
    >
      <motion.div className="glass summary-hero" variants={item}>
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 10 }}>
          {cast.map((ci, i) => (
            <motion.div
              key={i}
              style={{ margin: "0 -5px" }}
              initial={{ y: 0 }}
              animate={{ y: [0, -14, 0] }}
              transition={{ delay: 0.4 + i * 0.08, duration: 0.5 }}
            >
              <Avatar c={CHARACTERS[ci]} size={40} />
            </motion.div>
          ))}
        </div>
        <small>CONCLUSION</small>
        <h2>{topicTitle}</h2>
        <p data-testid="conclusion">{script.conclusion}</p>
      </motion.div>

      <motion.div className="glass section" variants={item}>
        <h3>議論の流れ</h3>
        <div className="flow">
          {PHASES.map((p, i) => {
            const first = script.lines.find((l) => l.p === i);
            return (
              <div className="flow-item" key={p.name}>
                <b>{p.name}</b>
                <span>{p.minutes}分</span>
                {first && <p>{first.t}</p>}
              </div>
            );
          })}
        </div>
      </motion.div>

      {tips.length > 0 && (
        <motion.div className="glass section" variants={item}>
          <h3>真似したいポイント</h3>
          <ul className="points">
            {tips.map((t, i) => (
              <li key={i}>{t}</li>
            ))}
          </ul>
        </motion.div>
      )}

      <motion.div className="summary-actions" variants={item}>
        <motion.button className="primary" whileTap={{ scale: 0.96 }} onClick={onReplay} data-testid="replay">
          <Icon.Replay size={18} />
          もう一度見る
        </motion.button>
        <div className="row">
          <motion.button className="glass secondary" whileTap={{ scale: 0.96 }} onClick={onChangeSize} data-testid="change-size">
            <Icon.Users size={18} />
            人数を変える
          </motion.button>
          <motion.button className="glass secondary" whileTap={{ scale: 0.96 }} onClick={onHome} data-testid="home">
            <Icon.Home size={18} />
            お題一覧
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  );
}
