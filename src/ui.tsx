// 役割としての発言に添えるラベル（話者番号順）
export const ROLE_ACTION = ["進行", "時間管理", "記録・整理", "まとめ・発表", "意見"];

export const spring = { type: "spring" as const, stiffness: 420, damping: 34 };
export const softSpring = { type: "spring" as const, stiffness: 260, damping: 26 };

export function haptic(ms = 8) {
  try {
    navigator.vibrate?.(ms);
  } catch {
    /* 未対応端末 */
  }
}

type IconProps = { size?: number };
const base = (size = 22) => ({
  width: size,
  height: size,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2.2,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
});

export const Icon = {
  Close: ({ size }: IconProps) => (
    <svg {...base(size)}><path d="M6 6l12 12M18 6L6 18" /></svg>
  ),
  Play: ({ size }: IconProps) => (
    <svg {...base(size)} fill="currentColor" stroke="none"><path d="M8 5.5v13a1 1 0 001.5.86l10.6-6.5a1 1 0 000-1.72L9.5 4.64A1 1 0 008 5.5z" /></svg>
  ),
  Pause: ({ size }: IconProps) => (
    <svg {...base(size)} fill="currentColor" stroke="none"><rect x="6" y="5" width="4.5" height="14" rx="1.5" /><rect x="13.5" y="5" width="4.5" height="14" rx="1.5" /></svg>
  ),
  Prev: ({ size }: IconProps) => (
    <svg {...base(size)}><path d="M15 6l-6 6 6 6" /></svg>
  ),
  Next: ({ size }: IconProps) => (
    <svg {...base(size)}><path d="M9 6l6 6-6 6" /></svg>
  ),
  Board: ({ size }: IconProps) => (
    <svg {...base(size)}><rect x="4" y="4" width="16" height="13" rx="2.5" /><path d="M8 20h8M12 17v3M8 9h8M8 12.5h5" /></svg>
  ),
  Shuffle: ({ size }: IconProps) => (
    <svg {...base(size)}><path d="M4 7h3.5c2 0 3.2 1 4.3 2.6l1.4 2.2c1 1.6 2.3 2.7 4.3 2.7H20M4 17h3.5c1.2 0 2.1-.4 2.9-1.1M17 4.5L20 7l-3 2.5M17 12l3 2.5-3 2.5M13.5 8.3c.8-.8 1.8-1.3 3-1.3H20" /></svg>
  ),
  Replay: ({ size }: IconProps) => (
    <svg {...base(size)}><path d="M4 12a8 8 0 108-8 8.4 8.4 0 00-6 2.5L4 8.5M4 4v4.5h4.5" /></svg>
  ),
  Users: ({ size }: IconProps) => (
    <svg {...base(size)}><circle cx="9" cy="8" r="3.2" /><path d="M3.5 19c.6-3.2 2.8-5 5.5-5s4.9 1.8 5.5 5M16 5.2a3 3 0 010 5.6M17.5 14.2c1.6.6 2.7 2.2 3 4.8" /></svg>
  ),
  Home: ({ size }: IconProps) => (
    <svg {...base(size)}><path d="M4 11l8-6.5 8 6.5V19a1 1 0 01-1 1h-4.5v-5h-5v5H5a1 1 0 01-1-1z" /></svg>
  ),
  Check: ({ size }: IconProps) => (
    <svg {...base(size)}><path d="M5 12.5l4.2 4L19 7" /></svg>
  ),
  Bulb: ({ size }: IconProps) => (
    <svg {...base(size)} stroke="#fff"><path d="M9 18h6M10 21h4M12 3a6 6 0 00-3.6 10.8c.6.5 1 1.2 1 2V16h5.2v-.2c0-.8.4-1.5 1-2A6 6 0 0012 3z" /></svg>
  ),
  Book: ({ size }: IconProps) => (
    <svg {...base(size)}><path d="M4 5.5A1.5 1.5 0 015.5 4H11v15H5.5A1.5 1.5 0 014 17.5zM20 5.5A1.5 1.5 0 0018.5 4H13v15h5.5a1.5 1.5 0 001.5-1.5z" /></svg>
  ),
  Skip: ({ size }: IconProps) => (
    <svg {...base(size)}><path d="M6 6l6 6-6 6M13 6l6 6-6 6" /></svg>
  ),
  ChevronUp: ({ size }: IconProps) => (
    <svg {...base(size)}><path d="M6 15l6-6 6 6" /></svg>
  ),
};
