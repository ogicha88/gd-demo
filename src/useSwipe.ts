import { useEffect, useRef } from "react";

type Handlers = { onUp?: () => void; onDown?: () => void; onLeft?: () => void; onRight?: () => void };

// ポインターイベントだけで判定するシンプルなフリック検出。
// 指が要素の外で離れても判定できるよう、離した位置は window で受け取る。
export function useSwipe(h: Handlers, threshold = 70) {
  const handlers = useRef(h);
  handlers.current = h;
  const cleanup = useRef<() => void>(() => {});
  useEffect(() => () => cleanup.current(), []);

  return {
    onPointerDown: (e: React.PointerEvent) => {
      cleanup.current();
      const s = { x: e.clientX, y: e.clientY, t: e.timeStamp };
      const up = (ev: PointerEvent) => {
        cleanup.current();
        const dx = ev.clientX - s.x;
        const dy = ev.clientY - s.y;
        // 速いフリックは短い距離でも反応させる
        const min = ev.timeStamp - s.t < 250 ? threshold * 0.5 : threshold;
        const cur = handlers.current;
        if (Math.abs(dy) > Math.abs(dx) * 1.2 && Math.abs(dy) > min) (dy < 0 ? cur.onUp : cur.onDown)?.();
        else if (Math.abs(dx) > Math.abs(dy) * 1.2 && Math.abs(dx) > min) (dx < 0 ? cur.onLeft : cur.onRight)?.();
      };
      const cancel = () => cleanup.current();
      window.addEventListener("pointerup", up);
      window.addEventListener("pointercancel", cancel);
      cleanup.current = () => {
        window.removeEventListener("pointerup", up);
        window.removeEventListener("pointercancel", cancel);
        cleanup.current = () => {};
      };
    },
  };
}
