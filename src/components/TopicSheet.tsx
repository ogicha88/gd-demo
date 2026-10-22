import { AnimatePresence, motion } from "motion/react";
import type { GdType, Size, Topic } from "../../shared/data";
import { CHARACTERS, SIZES, rolesForSize } from "../../shared/data";
import { Icon, ROLE_COLOR, haptic, spring } from "../ui";
import Avatar from "./Avatar";

type Props = {
  type: GdType;
  topic: Topic;
  size: Size;
  onSize: (s: Size) => void;
  onClose: () => void;
  onStart: () => void;
};

export default function TopicSheet({ type, topic, size, onSize, onClose, onStart }: Props) {
  const roles = rolesForSize(size);

  function shift(delta: number) {
    const i = SIZES.indexOf(size) + delta;
    if (i >= 0 && i < SIZES.length) {
      haptic();
      onSize(SIZES[i]);
    }
  }

  return (
    <>
      <motion.div className="scrim" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} />
      <motion.div
        className="glass sheet"
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={spring}
        drag="y"
        dragConstraints={{ top: 0, bottom: 0 }}
        dragElastic={{ top: 0.05, bottom: 0.8 }}
        onDragEnd={(_, info) => {
          if (info.offset.y > 110 || info.velocity.y > 600) onClose();
          else if (info.offset.y < -60 || info.velocity.y < -600) onStart();
        }}
        data-testid="topic-sheet"
      >
        <div className="grabber" />
        <div className="sheet-type" style={{ color: `hsl(${type.hue},60%,42%)` }}>{type.name}</div>
        <h3>{topic.title}</h3>

        <div className="label">参加人数</div>
        <div className="seg">
          {SIZES.map((s) => (
            <button
              key={s}
              className={s === size ? "on" : ""}
              onClick={() => {
                haptic();
                onSize(s);
              }}
              data-testid={`size-${s}`}
            >
              {s === size && <motion.span layoutId="seg-pill" className="seg-pill" transition={spring} />}
              {s}人
            </button>
          ))}
        </div>

        <motion.div
          className="crowd"
          onPanEnd={(_, info) => {
            if (Math.abs(info.offset.x) > 40 && Math.abs(info.offset.x) > Math.abs(info.offset.y)) shift(info.offset.x < 0 ? 1 : -1);
          }}
        >
          <AnimatePresence initial={false} mode="popLayout">
            {CHARACTERS.slice(0, size).map((c, i) => (
              <motion.div
                key={c.name}
                layout
                initial={{ opacity: 0, y: 30, scale: 0.4 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 30, scale: 0.4 }}
                transition={{ ...spring, delay: i * 0.03 }}
              >
                <Avatar c={c} size={56} />
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>

        <div className="roles-mini">
          <AnimatePresence initial={false} mode="popLayout">
            {roles.map((r, i) => (
              <motion.span
                layout
                key={`${r.key}-${i}`}
                className="role-chip"
                style={{ background: ROLE_COLOR[r.key] }}
                initial={{ opacity: 0, scale: 0.6 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.6 }}
                transition={spring}
              >
                {r.name}
              </motion.span>
            ))}
          </AnimatePresence>
        </div>

        <motion.button className="primary" whileTap={{ scale: 0.96 }} onClick={onStart} data-testid="to-roles">
          役割分担へ
          <Icon.Next size={18} />
        </motion.button>
      </motion.div>
    </>
  );
}
