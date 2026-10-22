import { expect, test } from "@playwright/test";
import { GD_TYPES, PHASES, SIZE } from "../shared/data";
import { SCRIPTS } from "./load-scripts";

// 台本データがルールどおりに書かれているかを検査する
for (const type of GD_TYPES) {
  for (const topic of type.topics) {
    test(`台本: ${topic.id}`, () => {
      const s = SCRIPTS[topic.id];
      expect(s, "台本ファイルがある").toBeTruthy();
      const { lines } = s;
      expect(lines.length).toBeGreaterThanOrEqual(30);
      expect(lines.length).toBeLessThanOrEqual(42);
      // フェーズは 0 から始まって戻らず、全フェーズを通る
      expect(lines[0].p).toBe(0);
      for (let i = 1; i < lines.length; i++) expect(lines[i].p).toBeGreaterThanOrEqual(lines[i - 1].p);
      expect(new Set(lines.map((l) => l.p)).size).toBe(PHASES.length);
      // 全員が話し、全員の役割が決まる
      expect(new Set(lines.map((l) => l.s)).size).toBe(SIZE);
      for (let sp = 0; sp < SIZE; sp++) expect(lines.filter((l) => l.s === sp && l.assign).length).toBe(1);
      // 役割決めは最初のフェーズで行う
      expect(lines.filter((l) => l.assign).every((l) => l.p === 0)).toBe(true);
      // 発表は発表者だけ
      expect(lines.filter((l) => l.p === PHASES.length - 1).every((l) => l.s === 3)).toBe(true);
      // 重要場面とボードのメモ
      const keys = lines.filter((l) => l.key);
      expect(keys.length).toBeGreaterThanOrEqual(8);
      expect(keys.length).toBeLessThanOrEqual(11);
      for (const k of keys) {
        expect(k.key!.title.length).toBeLessThanOrEqual(22);
        expect(k.key!.why.length).toBeGreaterThanOrEqual(40);
      }
      expect(lines.filter((l) => l.note).length).toBeGreaterThanOrEqual(6);
      expect(lines.filter((l) => l.role).length).toBeGreaterThanOrEqual(lines.length * 0.35);
      for (const l of lines) {
        expect(l.s).toBeGreaterThanOrEqual(0);
        expect(l.s).toBeLessThan(SIZE);
        expect(l.t.length).toBeGreaterThan(5);
        expect(l.t).not.toMatch(/フェーズ[0-5]|^\s*(note|tip)\s*:/);
      }
      expect(s.conclusion.length).toBeGreaterThan(10);
      expect(s.conclusion.length).toBeLessThanOrEqual(70);
    });
  }
}
