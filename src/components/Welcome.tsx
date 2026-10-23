import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";
import { CHARACTERS, ROLES } from "../../shared/data";
import { Icon, softSpring, spring } from "../ui";
import { useSwipe } from "../useSwipe";
import Avatar from "./Avatar";

type Props = { onStart: () => void; onSkip: () => void };

const HELLOS = ["よろしく！", "一緒に見よう！", "がんばろう！", "まかせて！", "楽しみ！"];

export default function Welcome({ onStart, onSkip }: Props) {
  // キャラクターが順番にあいさつする
  const [talker, setTalker] = useState(-1);
  useEffect(() => {
    const first = setTimeout(() => setTalker(0), 1200);
    const iv = setInterval(() => setTalker((t) => (t + 1) % CHARACTERS.length), 1800);
    return () => {
      clearTimeout(first);
      clearInterval(iv);
    };
  }, []);
  const swipe = useSwipe({ onUp: onStart }, 60);

  return (
    <motion.div
      className="screen welcome"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, y: -30 }}
      transition={{ duration: 0.3 }}
      {...swipe}
      data-testid="welcome"
    >
      <div className="welcome-main">
        <div className="welcome-people">
          {CHARACTERS.map((c, i) => (
            <motion.div
              key={c.name}
              className="welcome-person"
              initial={{ opacity: 0, y: 60, scale: 0.4 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ type: "spring", stiffness: 380, damping: 16, delay: 0.15 + i * 0.1 }}
            >
              <AnimatePresence>
                {talker === i && (
                  <motion.span
                    className="hello"
                    style={{ borderColor: ROLES[i].color, color: ROLES[i].color }}
                    initial={{ opacity: 0, y: 8, scale: 0.6 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -6, scale: 0.8 }}
                    transition={spring}
                  >
                    {HELLOS[i]}
                  </motion.span>
                )}
              </AnimatePresence>
              <Avatar c={c} size={i === 2 ? 64 : 54} talking={talker === i} />
              <span className="welcome-name" style={{ background: ROLES[i].color }}>
                {c.name}
              </span>
            </motion.div>
          ))}
        </div>

        <motion.h1 className="welcome-title" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ ...softSpring, delay: 0.75 }}>
          GDデモ
        </motion.h1>

        <motion.p className="welcome-lead" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ ...softSpring, delay: 0.9 }}>
          グループディスカッション（GD）の進め方を、
          <br />
          5人のキャラクターの模範デモで学べるアプリです。
        </motion.p>
        <motion.p className="welcome-sub" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ ...softSpring, delay: 1.05 }}>
          スタートを押すと、まずGDの流れとコツを確認して、
          <br />
          そのあとデモを見られます。
        </motion.p>
      </div>

      <motion.div className="welcome-foot" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ ...softSpring, delay: 1.3 }}>
        <motion.button className="primary" whileTap={{ scale: 0.96 }} onClick={onStart} data-testid="welcome-start">
          スタート
          <Icon.Next size={18} />
        </motion.button>
        <div className="skip-label">見たことがある方・すぐにデモを見たい方は</div>
        <motion.button className="skip-btn" whileTap={{ scale: 0.96 }} onClick={onSkip} data-testid="welcome-skip">
          スキップしてお題選択へ
          <Icon.Skip size={18} />
        </motion.button>
      </motion.div>
    </motion.div>
  );
}
