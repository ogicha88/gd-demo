import type { Script } from "../shared/data";
import { GD_TYPES } from "../shared/data";

// テスト用: src/scripts の台本を Node から読み込む（Vite の import.meta.glob を使わない版）
const ids = GD_TYPES.flatMap((t) => t.topics.map((p) => p.id));

export const SCRIPTS: Record<string, Script> = Object.fromEntries(
  await Promise.all(
    ids.map(async (id) => {
      try {
        const m = (await import(`../src/scripts/${id}.ts`)) as { default: Script };
        return [id, m.default] as const;
      } catch {
        return [id, undefined] as const;
      }
    }),
  ),
);
