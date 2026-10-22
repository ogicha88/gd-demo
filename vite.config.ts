import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { cloudflare } from "@cloudflare/vite-plugin";

// Windows ではプロジェクトのパスが深いと SQLite の 260 文字制限に当たるため、
// LOCAL_STATE_DIR でローカル状態の保存先を短いパスに変更できるようにする
const persistPath = process.env.LOCAL_STATE_DIR;

export default defineConfig({
  plugins: [react(), cloudflare(persistPath ? { persistState: { path: persistPath } } : {})],
});
