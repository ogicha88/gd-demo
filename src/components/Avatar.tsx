import { motion } from "motion/react";
import type { Character } from "../../shared/data";

type Props = { c: Character; size?: number; talking?: boolean; dim?: boolean };

// 髪型 6 種類（style 番号に対応）
function Hair({ style, color }: { style: number; color: string }) {
  switch (style) {
    case 1: // ボブ
      return (
        <>
          <path d="M14 46 C10 20 30 10 50 10 C70 10 90 20 86 46 L86 66 C80 70 76 62 76 50 L24 50 C24 62 20 70 14 66 Z" fill={color} />
          <path d="M26 38 C34 28 52 24 74 34 L74 26 C60 16 38 18 26 30 Z" fill={color} />
        </>
      );
    case 2: // ツンツン
      return (
        <path d="M18 44 L16 26 L26 30 L28 14 L38 24 L46 8 L54 22 L64 10 L68 26 L80 18 L80 32 L86 30 L82 46 C72 32 30 32 18 44 Z" fill={color} />
      );
    case 3: // ロング
      return (
        <>
          <path d="M12 50 C8 18 30 8 50 8 C72 8 94 18 88 50 L92 92 C80 96 76 80 78 56 L22 56 C24 80 20 96 8 92 Z" fill={color} />
          <path d="M24 40 C30 26 50 20 60 22 C52 30 40 36 24 40 Z" fill={color} />
        </>
      );
    case 4: // 七三
      return (
        <path d="M16 46 C12 18 34 8 52 10 C74 12 90 24 84 46 C78 34 66 28 58 30 C46 30 30 34 16 46 Z" fill={color} />
      );
    case 5: // ツインテール
      return (
        <>
          <circle cx="12" cy="56" r="10" fill={color} />
          <circle cx="88" cy="56" r="10" fill={color} />
          <path d="M16 48 C12 18 32 10 50 10 C70 10 90 18 84 48 C76 34 60 28 50 30 C40 28 24 34 16 48 Z" fill={color} />
        </>
      );
    default: // ショート
      return (
        <path d="M16 46 C12 20 30 10 50 10 C70 10 88 20 84 46 C80 36 70 30 50 32 C34 30 22 36 16 46 Z" fill={color} />
      );
  }
}

export default function Avatar({ c, size = 64, talking = false, dim = false }: Props) {
  return (
    <motion.svg
      viewBox="0 0 100 120"
      width={size}
      height={size * 1.2}
      animate={talking ? { y: [0, -3, 0] } : { y: 0 }}
      transition={talking ? { duration: 0.45, repeat: Infinity, ease: "easeInOut" } : { duration: 0.3 }}
      style={{ opacity: dim ? 0.55 : 1, overflow: "visible", transition: "opacity .3s" }}
      aria-hidden
    >
      {/* 体 */}
      <path d="M20 120 C20 96 34 86 50 86 C66 86 80 96 80 120 Z" fill={c.shirt} />
      <path d="M42 86 L50 96 L58 86 Z" fill="#fff" opacity="0.9" />
      {/* 首 */}
      <rect x="44" y="76" width="12" height="12" rx="5" fill={c.skin} />
      {c.style === 3 && <path d="M12 50 L8 92 C20 96 24 80 22 56 Z M88 50 L92 92 C80 96 76 80 78 56 Z" fill={c.hair} />}
      {/* 顔 */}
      <ellipse cx="50" cy="50" rx="33" ry="31" fill={c.skin} />
      <Hair style={c.style} color={c.hair} />
      {/* 目 */}
      <motion.g
        animate={{ scaleY: [1, 1, 0.1, 1] }}
        transition={{ duration: 4, repeat: Infinity, times: [0, 0.92, 0.95, 1], delay: c.style * 0.4 }}
        style={{ originY: "56px" }}
      >
        <ellipse cx="38" cy="56" rx="3.6" ry="4.4" fill="#2b2b33" />
        <ellipse cx="62" cy="56" rx="3.6" ry="4.4" fill="#2b2b33" />
        <circle cx="39.2" cy="54.6" r="1.2" fill="#fff" />
        <circle cx="63.2" cy="54.6" r="1.2" fill="#fff" />
      </motion.g>
      {/* ほっぺ */}
      <ellipse cx="29" cy="65" rx="5" ry="3" fill="#ff9aa8" opacity="0.45" />
      <ellipse cx="71" cy="65" rx="5" ry="3" fill="#ff9aa8" opacity="0.45" />
      {/* 口 */}
      {talking ? (
        <motion.ellipse
          cx="50"
          cy="68"
          rx="5"
          fill="#c4485e"
          animate={{ ry: [1.2, 4, 1.6, 3.4, 1.2] }}
          transition={{ duration: 0.6, repeat: Infinity }}
        />
      ) : (
        <path d="M44 66 Q50 71 56 66" stroke="#b44a5a" strokeWidth="2.4" fill="none" strokeLinecap="round" />
      )}
    </motion.svg>
  );
}
