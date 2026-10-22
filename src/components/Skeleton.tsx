import { motion } from "motion/react";

function Sk({ w, h, r, style }: { w?: number | string; h: number; r?: number; style?: React.CSSProperties }) {
  return <i className="sk" style={{ width: w ?? "100%", height: h, borderRadius: r, flexShrink: 0, ...style }} />;
}

// 起動時の全画面スケルトン（index.html の静的スケルトンと同じレイアウト）
export function HomeSkeleton() {
  return (
    <motion.div
      className="screen"
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      aria-busy="true"
      data-testid="skeleton-home"
    >
      <div className="topbar">
        <Sk w={110} h={26} />
      </div>
      <Sk h={196} r={30} style={{ marginTop: 18, width: "min(78vw, 360px)", alignSelf: "center" }} />
      <div className="dots" style={{ marginTop: 10 }}>
        <Sk w={18} h={6} r={3} />
        <Sk w={6} h={6} r={3} />
        <Sk w={6} h={6} r={3} />
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <Sk h={84} r={22} />
        <Sk h={84} r={22} />
        <Sk h={84} r={22} />
      </div>
    </motion.div>
  );
}
