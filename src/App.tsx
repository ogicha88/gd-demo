import { AnimatePresence } from "motion/react";
import { useEffect, useState } from "react";
import type { GdType, Topic } from "../shared/data";
import Demo from "./components/Demo";
import Home from "./components/Home";
import { HomeSkeleton } from "./components/Skeleton";
import Summary from "./components/Summary";
import TopicSheet from "./components/TopicSheet";
import { SCRIPTS } from "./scripts";
import Guide from "./components/Guide";
import { intro, views as viewStore } from "./views";

type Screen = "home" | "demo" | "summary";

export default function App() {
  const [ready, setReady] = useState(false);
  const [views, setViews] = useState<Record<string, number>>({});
  const [screen, setScreen] = useState<Screen>("home");
  const [typeIndex, setTypeIndex] = useState(0);
  const [picked, setPicked] = useState<{ type: GdType; topic: Topic } | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [replayKey, setReplayKey] = useState(0);
  // 初回は GD の基本ガイドから始める。2回目以降は「GDの基本」ボタンから見返せる
  const [guide, setGuide] = useState<"intro" | "review" | null>(null);
  const script = picked ? SCRIPTS[picked.topic.id] : undefined;

  useEffect(() => {
    setViews(viewStore.load());
    if (!intro.seen()) setGuide("intro");
    // フォントの読み込みを待ってから表示し、スケルトンを一瞬で消さないよう最低表示時間を設ける
    // 通信が遅い場合でもフォント待ちは最大 1.5 秒で打ち切る
    const fonts = Promise.race([document.fonts?.ready, new Promise((r) => setTimeout(r, 1500))]);
    Promise.all([fonts, new Promise((r) => setTimeout(r, 400))]).then(() => setReady(true));
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
        {ready && guide && (
          <Guide
            key={`guide-${guide}`}
            mode={guide}
            onDone={() => {
              intro.markSeen();
              setGuide(null);
            }}
          />
        )}
        {ready && !guide && screen === "home" && (
          <Home
            key="home"
            views={views}
            typeIndex={typeIndex}
            onTypeIndex={setTypeIndex}
            onPick={(type, topic) => {
              setPicked({ type, topic });
              setSheetOpen(true);
            }}
            onGuide={() => setGuide("review")}
          />
        )}
        {ready && !guide && picked && script && screen === "demo" && (
          <Demo key={`demo-${replayKey}`} script={script} topicTitle={picked.topic.title} onExit={goHome} onFinish={() => setScreen("summary")} />
        )}
        {ready && !guide && picked && script && screen === "summary" && (
          <Summary
            key="summary"
            script={script}
            topicTitle={picked.topic.title}
            onReplay={startDemo}
            onHome={goHome}
            onGuide={() => setGuide("review")}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {ready && !guide && screen === "home" && sheetOpen && picked && (
          <TopicSheet key="sheet" type={picked.type} topic={picked.topic} onClose={() => setSheetOpen(false)} onStart={startDemo} />
        )}
      </AnimatePresence>
    </>
  );
}
