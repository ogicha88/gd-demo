import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { PHASES, ROLES, TOTAL_MINUTES } from "../../shared/data";
import { BASICS, EVALUATION, FLOW_NOTES, NG } from "../guide";
import { Icon, haptic, spring } from "../ui";
import { useSwipe } from "../useSwipe";

type Props = {
  mode: "intro" | "review"; // intro: 初回の案内 / review: ホームから振り返り
  onDone: () => void;
};

const PAGES = ["GDの流れ", "押さえておきたい基本", "人事が見ているポイント"];
const TABS = ["流れ", "基本", "人事の視点"];

const list = { show: { transition: { staggerChildren: 0.05, delayChildren: 0.1 } } };
const item = { hidden: { opacity: 0, y: 14 }, show: { opacity: 1, y: 0, transition: spring } };

function FlowPage() {
  let elapsed = 0;
  return (
    <motion.ol className="g-flow" variants={list} initial="hidden" animate="show">
      {PHASES.map((p, i) => {
        const from = elapsed;
        elapsed += p.minutes;
        return (
          <motion.li key={p.name} variants={item}>
            <span className="g-step">{i + 1}</span>
            <div>
              <b>{p.name}</b>
              <small>
                {from}〜{elapsed}分
              </small>
              <p>{FLOW_NOTES[i]}</p>
            </div>
          </motion.li>
        );
      })}
      <motion.p className="g-note" variants={item}>
        {TOTAL_MINUTES}分の場合の目安です。本番は30〜45分のことが多いですが、同じ順番・同じ比率で考えればOKです。
      </motion.p>
    </motion.ol>
  );
}

function BasicsPage() {
  return (
    <motion.div variants={list} initial="hidden" animate="show">
      <motion.h4 className="g-sub" variants={item}>役割</motion.h4>
      <motion.div className="g-roles" variants={item}>
        {ROLES.map((r) => (
          <div key={r.key} className="g-role" style={{ borderColor: r.color }}>
            <i style={{ background: r.color }}>{r.name}</i>
            <span>{r.duty}</span>
          </div>
        ))}
      </motion.div>
      <motion.p className="g-note" variants={item}>
        役割がなくても評価は下がりません。大事なのは、議論を前に進める発言です。
      </motion.p>
      <motion.h4 className="g-sub" variants={item}>コツ</motion.h4>
      <ul className="g-tips">
        {BASICS.map((b, i) => (
          <motion.li key={b.title} variants={item}>
            <span className="g-num">{i + 1}</span>
            <div>
              <b>{b.title}</b>
              <p>{b.body}</p>
            </div>
          </motion.li>
        ))}
      </ul>
    </motion.div>
  );
}

function EvaluationPage() {
  return (
    <motion.div variants={list} initial="hidden" animate="show">
      <div className="g-eval">
        {EVALUATION.map((e, i) => (
          <motion.div key={e.title} className="g-card" variants={item} style={{ "--c": ROLES[i].color } as React.CSSProperties}>
            <b>{e.title}</b>
            <p>{e.body}</p>
          </motion.div>
        ))}
      </div>
      <motion.p className="g-note" variants={item}>
        発言の回数より、議論への貢献の質が見られています。
      </motion.p>
      <motion.h4 className="g-sub" variants={item}>やりがちなNG</motion.h4>
      <motion.ul className="g-ng" variants={item}>
        {NG.map((n) => (
          <li key={n}>{n}</li>
        ))}
      </motion.ul>
    </motion.div>
  );
}

export default function Guide({ mode, onDone }: Props) {
  const [[page, dir], setPage] = useState<[number, number]>([0, 1]);
  const last = page === PAGES.length - 1;

  function go(next: number) {
    if (next < 0 || next >= PAGES.length || next === page) return;
    haptic();
    setPage([next, next > page ? 1 : -1]);
  }

  const swipe = useSwipe({ onLeft: () => go(page + 1), onRight: () => go(page - 1) }, 60);

  return (
    <motion.div
      className="screen guide"
      initial={{ opacity: 0, y: mode === "review" ? 40 : 0 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: mode === "review" ? 40 : -20 }}
      transition={spring}
      data-testid="guide"
    >
      <div className="guide-top">
        <span className="guide-count">
          {page + 1} / {PAGES.length}
        </span>
        {mode === "review" ? (
          <motion.button className="glass icon-btn" whileTap={{ scale: 0.9 }} onClick={onDone} aria-label="閉じる" data-testid="guide-close">
            <Icon.Close />
          </motion.button>
        ) : (
          <button className="guide-skip" onClick={onDone} data-testid="guide-skip">
            スキップ
          </button>
        )}
      </div>

      <div className="guide-tabs">
        {TABS.map((p, i) => (
          <button key={p} className={i === page ? "on" : ""} onClick={() => go(i)} data-testid={`guide-tab-${i}`}>
            {i === page && <motion.span layoutId="guide-tab" className="guide-tab-pill" transition={spring} />}
            <span>{p}</span>
          </button>
        ))}
      </div>

      <div className="guide-body" {...swipe}>
        <AnimatePresence mode="popLayout" initial={false} custom={dir}>
          <motion.div
            key={page}
            className="guide-page"
            custom={dir}
            variants={{
              enter: (d: number) => ({ opacity: 0, x: d * 60 }),
              center: { opacity: 1, x: 0 },
              exit: (d: number) => ({ opacity: 0, x: d * -60 }),
            }}
            initial="enter"
            animate="center"
            exit="exit"
            transition={spring}
            data-testid={`guide-page-${page}`}
          >
            <h2>{PAGES[page]}</h2>
            {page === 0 && <FlowPage />}
            {page === 1 && <BasicsPage />}
            {page === 2 && <EvaluationPage />}
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="guide-foot">
        <div className="guide-dots">
          {PAGES.map((p, i) => (
            <motion.span key={p} animate={{ width: i === page ? 18 : 6, opacity: i === page ? 1 : 0.35 }} transition={spring} />
          ))}
        </div>
        <motion.button
          className="primary"
          whileTap={{ scale: 0.96 }}
          onClick={() => (last ? onDone() : go(page + 1))}
          data-testid="guide-next"
        >
          {last ? (
            mode === "intro" ? (
              <>
                <Icon.Play size={18} />
                デモを見てみる
              </>
            ) : (
              "閉じる"
            )
          ) : (
            <>
              次へ
              <Icon.Next size={18} />
            </>
          )}
        </motion.button>
      </div>
    </motion.div>
  );
}
