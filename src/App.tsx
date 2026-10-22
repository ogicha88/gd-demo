import { AnimatePresence } from "motion/react";
import { useEffect, useState } from "react";
import type { GdType, Topic } from "../shared/data";
import Demo from "./components/Demo";
import Home from "./components/Home";
import { HomeSkeleton } from "./components/Skeleton";
import Summary from "./components/Summary";
import TopicSheet from "./components/TopicSheet";
import { SCRIPTS } from "./scripts";
import { views as viewStore } from "./views";

type Screen = "home" | "demo" | "summary";

export default function App() {
  const [ready, setReady] = useState(false);
  const [views, setViews] = useState<Record<string, number>>({});
  const [screen, setScreen] = useState<Screen>("home");
  const [typeIndex, setTypeIndex] = useState(0);
  const [picked, setPicked] = useState<{ type: GdType; topic: Topic } | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [replayKey, setReplayKey] = useState(0);
  const script = picked ? SCRIPTS[picked.topic.id] : undefined;

  useEffect(() => {
    setViews(viewStore.load());
    // フォントの読み込みを待ってから表示し、スケルトンを一瞬で消さないよう最低表示時間を設ける
    Promise.all([document.fonts?.ready, new Promise((r) => setTimeout(r, 400))]).then(() => setReady(true));
  }, []);

  // ブラウザの戻る操作でホームへ戻る
  useEffect(() => {
    const onPop = () => {
      setSheetOpen(false);
      setScreen("home");
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  function startDemo() {
    if (!picked) return;
    setSheetOpen(false);
    setViews(viewStore.add(picked.topic.id));
    setReplayKey((k) => k + 1);
    if (screen === "home") history.pushState({ gd: true }, "");
    setScreen("demo");
  }

  function goHome() {
    if (history.state?.gd) history.back();
    else setScreen("home");
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
        {ready && picked && script && screen === "demo" && (
          <Demo key={`demo-${replayKey}`} script={script} topicTitle={picked.topic.title} onExit={goHome} onFinish={() => setScreen("summary")} />
        )}
        {ready && picked && script && screen === "summary" && (
          <Summary key="summary" script={script} topicTitle={picked.topic.title} onReplay={startDemo} onHome={goHome} />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {ready && screen === "home" && sheetOpen && picked && (
          <TopicSheet key="sheet" type={picked.type} topic={picked.topic} onClose={() => setSheetOpen(false)} onStart={startDemo} />
        )}
      </AnimatePresence>
    </>
  );
}
