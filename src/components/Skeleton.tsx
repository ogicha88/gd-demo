import { motion } from "motion/react";

const fade = { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 }, transition: { duration: 0.25 } };

function Sk({ w, h, r, style }: { w?: number | string; h: number; r?: number; style?: React.CSSProperties }) {
  return <i className="sk" style={{ width: w ?? "100%", height: h, borderRadius: r, flexShrink: 0, ...style }} />;
}

export function HomeSkeleton() {
  return (
    <motion.div className="screen" {...fade} aria-busy="true" data-testid="skeleton-home">
      <div className="topbar">
        <Sk w={110} h={26} />
      </div>
      <Sk h={196} r={30} style={{ marginTop: 14, width: "min(78vw, 360px)", alignSelf: "center" }} />
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

export function DemoSkeleton({ status }: { status?: string }) {
  return (
    <motion.div className="screen demo" {...fade} aria-busy="true" data-testid="skeleton-demo">
      <div className="demo-top">
        <Sk w={42} h={42} r={21} />
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 6 }}>
          <Sk w="80%" h={13} r={6} />
          <Sk w="40%" h={10} r={5} />
        </div>
        <Sk w={70} h={38} r={14} />
      </div>
      <div className="phasebar">
        {Array.from({ length: 6 }).map((_, i) => (
          <Sk key={i} h={5} r={3} style={{ flex: 1 }} />
        ))}
      </div>
      <div className="stage" style={{ display: "grid", placeItems: "center" }}>
        <Sk w="62%" h={90} r={999} />
      </div>
      <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 14 }}>
        {[72, 58, 80].map((w, i) => (
          <div key={i} style={{ display: "flex", gap: 8 }}>
            <Sk w={36} h={36} r={18} />
            <Sk w={`${w}%`} h={62} r={20} />
          </div>
        ))}
      </div>
      {status && <div className="sk-status">{status}</div>}
      <Sk h={76} r={26} />
    </motion.div>
  );
}
