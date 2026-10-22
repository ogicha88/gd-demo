import { motion } from "motion/react";
import type { GdType, Topic } from "../../shared/data";
import { CHARACTERS, ROLES } from "../../shared/data";
import { Icon, spring } from "../ui";
import { useSwipe } from "../useSwipe";
import Avatar from "./Avatar";

type Props = {
  type: GdType;
  topic: Topic;
  onClose: () => void;
  onStart: () => void;
};

export default function TopicSheet({ type, topic, onClose, onStart }: Props) {
  // 上フリックで開始（下フリックで閉じるのはドラッグ側で判定）
  const swipe = useSwipe({ onUp: onStart }, 60);
  return (
    <>
      <motion.div className="scrim" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} />
      <motion.div
        className="sheet"
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={spring}
        drag="y"
        dragConstraints={{ top: 0, bottom: 0 }}
        dragElastic={{ top: 0.12, bottom: 0.8 }}
        onDragEnd={(_, info) => {
          if (info.offset.y > 90 || info.velocity.y > 500) onClose();
        }}
        {...swipe}
        data-testid="topic-sheet"
      >
        <div className="grabber" />
        <div className="sheet-type" style={{ color: `hsl(${type.hue},60%,42%)` }}>{type.name}</div>
        <h3>{topic.title}</h3>

        <div className="label">参加者 5人</div>
        <div className="crowd">
          {CHARACTERS.map((c, i) => (
            <motion.div
              key={c.name}
              className="crowd-person"
              initial={{ opacity: 0, y: 24, scale: 0.6 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ ...spring, delay: 0.08 + i * 0.05 }}
            >
              <Avatar c={c} size={50} />
              <span>{c.name}</span>
              <motion.i
                className="role-chip"
                style={{ background: ROLES[i].color }}
                initial={{ opacity: 0, scale: 0.6 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ ...spring, delay: 0.3 + i * 0.05 }}
              >
                {ROLES[i].short}
              </motion.i>
            </motion.div>
          ))}
        </div>

        <motion.button className="primary" whileTap={{ scale: 0.96 }} onClick={onStart} data-testid="start-demo">
          <Icon.Play size={18} />
          デモを見る
        </motion.button>
      </motion.div>
    </>
  );
}
