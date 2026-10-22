import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useRef, useState } from "react";
import type { GdType, Script, Size, Topic } from "../shared/data";
import { CHARACTERS } from "../shared/data";
import { api, views as viewStore } from "./api";
import Demo from "./components/Demo";
import Home from "./components/Home";
import RoleAssign from "./components/RoleAssign";
import { DemoSkeleton, HomeSkeleton } from "./components/Skeleton";
import Summary from "./components/Summary";
import TopicSheet from "./components/TopicSheet";

type Screen = "home" | "roles" | "demo" | "summary";

function shuffledCast(size: number): number[] {
  const ids = CHARACTERS.map((_, i) => i);
  for (let i = ids.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [ids[i], ids[j]] = [ids[j], ids[i]];
  }
  return ids.slice(0, size);
}

export default function App() {
  const [ready, setReady] = useState(false);
  const [views, setViews] = useState<Record<string, number>>({});
  const [screen, setScreen] = useState<Screen>("home");
  const [typeIndex, setTypeIndex] = useState(0);
  const [picked, setPicked] = useState<{ type: GdType; topic: Topic } | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [size, setSize] = useState<Size>(4);
  const [cast, setCast] = useState<number[]>([]);
  const [seed, setSeed] = useState(0);
  const [script, setScript] = useState<Script | null>(null);
  const [error, setError] = useState("");
  const [replayKey, setReplayKey] = useState(0);
  const loadingKey = useRef("");

  useEffect(() => {
    setViews(viewStore.load());
    // フォントの読み込みを待ってから表示し、スケルトンを一瞬で消さないよう最低表示時間を設ける
    Promise.all([document.fonts?.ready, new Promise((r) => setTimeout(r, 450))]).then(() => setReady(true));
  }, []);

  const loadScript = useCallback((topicId: string, s: number) => {
    const key = `${topicId}:${s}`;
    if (loadingKey.current === key) return;
    loadingKey.current = key;
    setScript(null);
    api
      .script(topicId, s)
      .then((data) => {
        if (loadingKey.current === key) setScript(data);
      })
      .catch(() => {
        if (loadingKey.current !== key) return;
        loadingKey.current = "";
        setError("台本の読み込みに失敗しました。もう一度お試しください");
        setScreen((cur) => (cur === "demo" ? "roles" : cur));
      });
  }, []);

  useEffect(() => {
    if (!error) return;
    const t = setTimeout(() => setError(""), 3500);
    return () => clearTimeout(t);
  }, [error]);

  // ブラウザの戻る操作に対応
  useEffect(() => {
    const onPop = () => {
      if (sheetOpen) setSheetOpen(false);
      else setScreen((s) => (s === "demo" || s === "summary" ? "roles" : "home"));
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, [sheetOpen]);

  function go(next: Screen) {
    if (next !== "home" && screen === "home") history.pushState({ gd: true }, "");
    setScreen(next);
  }

  function toRoles() {
    if (!picked) return;
    setSheetOpen(false);
    setCast(shuffledCast(size));
    setSeed((s) => s + 1);
    loadScript(picked.topic.id, size);
    go("roles");
  }

  function startDemo() {
    if (!picked) return;
    loadScript(picked.topic.id, size);
    setViews(viewStore.add(picked.topic.id));
    setReplayKey((k) => k + 1);
    go("demo");
  }

  return (
    <>
      <div className="backdrop">
        <div className="blob b1" />
        <div className="blob b2" />
        <div className="blob b3" />
      </div>

      <AnimatePresence mode="wait">
        {!ready && <HomeSkeleton key="sk" />}
        {ready && screen === "home" && (
          <Home
            key="home"
            views={views}
            typeIndex={typeIndex}
            onTypeIndex={setTypeIndex}
            onPick={(type, topic) => {
              setPicked({ type, topic });
              setSheetOpen(true);
            }}
          />
        )}
        {ready && picked && screen === "roles" && (
          <RoleAssign
            key="roles"
            topicTitle={picked.topic.title}
            size={size}
            cast={cast}
            seed={seed}
            onShuffle={() => {
              setCast(shuffledCast(size));
              setSeed((s) => s + 1);
            }}
            onStart={startDemo}
            onBack={() => history.back()}
          />
        )}
        {ready && picked && screen === "demo" && !script && <DemoSkeleton key="demo-sk" status="台本を準備中" />}
        {ready && picked && screen === "demo" && script && (
          <Demo
            key={`demo-${replayKey}`}
            script={script}
            topicTitle={picked.topic.title}
            cast={cast}
            onExit={() => setScreen("roles")}
            onFinish={() => setScreen("summary")}
          />
        )}
        {ready && picked && screen === "summary" && script && (
          <Summary
            key="summary"
            script={script}
            topicTitle={picked.topic.title}
            cast={cast}
            onReplay={startDemo}
            onChangeSize={() => {
              setScreen("home");
              setSheetOpen(true);
            }}
            onHome={() => {
              setScreen("home");
              history.back();
            }}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {ready && screen === "home" && sheetOpen && picked && (
          <TopicSheet
            key="sheet"
            type={picked.type}
            topic={picked.topic}
            size={size}
            onSize={setSize}
            onClose={() => setSheetOpen(false)}
            onStart={toRoles}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {error && (
          <motion.div className="glass toast" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}>
            {error}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
