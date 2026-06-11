/* =========================================================
   アプリ制御：タブ／ルーティング、設定ダイアログ、SW登録
   ========================================================= */
import { settings } from "./store.js";
import * as home from "./views/home.js";
import * as schedule from "./views/schedule.js";
import * as live from "./views/live.js";
import * as watch from "./views/watch.js";

const views = { home, schedule, live, watch };
const root = document.getElementById("view");
let current = null;

async function route(name) {
  if (!views[name]) name = "home";
  // 前ビューのタイマー等を停止
  if (current && views[current].cleanup) views[current].cleanup();
  current = name;

  // タブのアクティブ表示
  document.querySelectorAll(".tab").forEach((t) => {
    const active = t.dataset.route === name;
    t.classList.toggle("is-active", active);
    t.setAttribute("aria-selected", active ? "true" : "false");
  });

  root.scrollTo?.(0, 0);
  window.scrollTo(0, 0);
  await views[name].render(root);
}

// タブクリック
document.querySelectorAll(".tab").forEach((t) => {
  t.addEventListener("click", () => {
    const name = t.dataset.route;
    location.hash = "#" + name;
  });
});

window.addEventListener("hashchange", () => route(location.hash.slice(1)));

// 設定ダイアログ
const dialog = document.getElementById("settingsDialog");
const urlInput = document.getElementById("workerUrl");
document.getElementById("settingsBtn").addEventListener("click", () => {
  urlInput.value = settings.workerUrl;
  dialog.showModal();
});
document.getElementById("settingsForm").addEventListener("submit", (e) => {
  // method=dialog の submit。保存ボタンのときだけ反映
  if (dialog.returnValue !== "cancel") {
    settings.workerUrl = urlInput.value;
    route(current); // 再取得
  }
});

// 初期表示
route((location.hash.slice(1)) || "home");

// Service Worker 登録（PWA / オフライン）
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./sw.js").catch(() => {});
  });
}
