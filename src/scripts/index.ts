import type { Script } from "../../shared/data";

// src/scripts/<topicId>.ts をすべて読み込み、お題 ID で引けるようにする
const modules = import.meta.glob<{ default: Script }>("./*.ts", { eager: true });

export const SCRIPTS: Record<string, Script> = Object.fromEntries(
  Object.entries(modules)
    .filter(([path]) => !path.endsWith("/index.ts"))
    .map(([, m]) => [m.default.topicId, m.default]),
);
