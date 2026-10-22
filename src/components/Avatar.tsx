import type { Character } from "../../shared/data";

type Props = { c: Character; size?: number; talking?: boolean; className?: string };

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
      return <path d="M18 44 L16 26 L26 30 L28 14 L38 24 L46 8 L54 22 L64 10 L68 26 L80 18 L80 32 L86 30 L82 46 C72 32 30 32 18 44 Z" fill={color} />;
    case 3: // ロング
      return (
        <>
          <path d="M12 50 C8 18 30 8 50 8 C72 8 94 18 88 50 L92 92 C80 96 76 80 78 56 L22 56 C24 80 20 96 8 92 Z" fill={color} />
          <path d="M24 40 C30 26 50 20 60 22 C52 30 40 36 24 40 Z" fill={color} />
        </>
      );
    case 4: // 七三
      return <path d="M16 46 C12 18 34 8 52 10 C74 12 90 24 84 46 C78 34 66 28 58 30 C46 30 30 34 16 46 Z" fill={color} />;
    case 5: // ツインテール
      return (
        <>
          <circle cx="12" cy="56" r="10" fill={color} />
          <circle cx="88" cy="56" r="10" fill={color} />
          <path d="M16 48 C12 18 32 10 50 10 C70 10 90 18 84 48 C76 34 60 28 50 30 C40 28 24 34 16 48 Z" fill={color} />
        </>
      );
    default: // ショート
      return <path d="M16 46 C12 20 30 10 50 10 C70 10 88 20 84 46 C80 36 70 30 50 32 C34 30 22 36 16 46 Z" fill={color} />;
  }
}

// アニメーションは CSS（styles.css の .av-*）で行い、描画を軽く保つ
export default function Avatar({ c, size = 64, talking = false, className = "" }: Props) {
  return (
    <svg
      viewBox="0 0 100 120"
      width={size}
      height={size * 1.2}
      className={`avatar${talking ? " talking" : ""} ${className}`}
      style={{ "--blink-delay": `${c.style * 0.9}s` } as React.CSSProperties}
      aria-hidden
    >
      {/* 体 */}
      <path d="M20 120 C20 96 34 86 50 86 C66 86 80 96 80 120 Z" fill={c.shirt} />
      <path d="M42 86 L50 96 L58 86 Z" fill="#fff" opacity="0.9" />
      <rect x="44" y="76" width="12" height="12" rx="5" fill={c.skin} />
      {/* 顔 */}
      <ellipse cx="50" cy="50" rx="33" ry="31" fill={c.skin} />
      <Hair style={c.style} color={c.hair} />
      {/* 目（開いた目と閉じた目を切り替えてまばたき） */}
      <g className="av-eyes-open">
        <ellipse cx="38" cy="56" rx="3.6" ry="4.4" fill="#2b2b33" />
        <ellipse cx="62" cy="56" rx="3.6" ry="4.4" fill="#2b2b33" />
        <circle cx="39.2" cy="54.6" r="1.2" fill="#fff" />
        <circle cx="63.2" cy="54.6" r="1.2" fill="#fff" />
      </g>
      <g className="av-eyes-closed" stroke="#2b2b33" strokeWidth="2.2" strokeLinecap="round" fill="none">
        <path d="M34 57 Q38 60 42 57" />
        <path d="M58 57 Q62 60 66 57" />
      </g>
      {/* ほっぺ */}
      <ellipse cx="29" cy="65" rx="5" ry="3" fill="#ff9aa8" opacity="0.45" />
      <ellipse cx="71" cy="65" rx="5" ry="3" fill="#ff9aa8" opacity="0.45" />
      {/* 口 */}
      <path className="av-smile" d="M44 66 Q50 71 56 66" stroke="#b44a5a" strokeWidth="2.4" fill="none" strokeLinecap="round" />
      <ellipse className="av-mouth" cx="50" cy="68" rx="5" ry="3.6" fill="#c4485e" />
    </svg>
  );
}
