/* =========================================================
   共通ユーティリティ（時刻整形・DOM生成）
   ========================================================= */

const JST = "Asia/Tokyo";

/** UTC ISO 文字列 → 日本時間の各種表記 */
export function jst(iso) {
  const date = new Date(iso);
  const opt = { timeZone: JST };
  return {
    date,
    dateStr: date.toLocaleDateString("ja-JP", { ...opt, month: "long", day: "numeric", weekday: "short" }),
    timeStr: date.toLocaleTimeString("ja-JP", { ...opt, hour: "2-digit", minute: "2-digit" }),
    dayKey: date.toLocaleDateString("ja-JP", { ...opt, year: "numeric", month: "2-digit", day: "2-digit" }),
  };
}

/** ミリ秒 → {d,h,m,s} */
export function breakdown(ms) {
  if (ms < 0) ms = 0;
  const s = Math.floor(ms / 1000);
  return {
    d: Math.floor(s / 86400),
    h: Math.floor((s % 86400) / 3600),
    m: Math.floor((s % 3600) / 60),
    s: s % 60,
  };
}

export const STATUS_LABEL = {
  SCHEDULED: "予定", TIMED: "予定", IN_PLAY: "試合中", PAUSED: "ハーフタイム",
  FINISHED: "終了", POSTPONED: "延期", SUSPENDED: "中断", CANCELLED: "中止",
};

export const isLive = (m) => m.status === "IN_PLAY" || m.status === "PAUSED";
export const isDone = (m) => m.status === "FINISHED";

/** 簡易DOMビルダー: el("div", {class:"x"}, [child, "text"]) */
export function el(tag, attrs = {}, children = []) {
  const node = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (v == null || v === false) continue;
    if (k === "class") node.className = v;
    else if (k === "html") node.innerHTML = v;
    else if (k.startsWith("on") && typeof v === "function") node.addEventListener(k.slice(2), v);
    else node.setAttribute(k, v);
  }
  for (const c of [].concat(children)) {
    if (c == null || c === false) continue;
    node.appendChild(typeof c === "string" ? document.createTextNode(c) : c);
  }
  return node;
}

export function clear(node) { while (node.firstChild) node.removeChild(node.firstChild); }

/* ---- チームエンブレム ----
   crest が画像URLなら <img>、そうでなければ略称モノグラムの円形バッジ。
   size: "lg"(ヒーロー) | "md"(リスト) | "sm" */
const JP_NAMES = ["日本", "Japan", "JPN"];
const isJapan = (name = "") => JP_NAMES.some((n) => name.includes(n));

function monogram(name = "") {
  const m = name.match(/[A-Za-z0-9]+/);          // ローマ字/数字部分を優先
  if (m) return m[0].slice(0, 3).toUpperCase();
  return name.slice(0, 2);                         // 日本語などは先頭2文字
}

// チーム名から安定した色相を作る（モノグラムの彩り）
function hueOf(name = "") {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) % 360;
  return h;
}

export function crest(team = {}, size = "md") {
  const src = team.crest || "";
  if (/^https?:/.test(src)) {
    return el("img", { class: `crest crest--${size} crest--img`, src, alt: team.name || "", loading: "lazy" });
  }
  const node = el("div", { class: `crest crest--${size} crest--mono` }, monogram(team.name));
  if (isJapan(team.name)) {
    node.classList.add("crest--jp");
  } else {
    const hue = hueOf(team.name || "");
    node.style.setProperty("--c1", `hsl(${hue} 45% 32%)`);
    node.style.setProperty("--c2", `hsl(${(hue + 30) % 360} 40% 20%)`);
  }
  return node;
}

export function loading(msg = "読み込み中…") {
  return el("div", { class: "loading" }, [el("div", { class: "spinner" }), msg]);
}

export function empty(emoji, msg) {
  return el("div", { class: "empty" }, [el("span", { class: "empty__emoji" }, emoji), msg]);
}

export function demoNote() {
  return el("p", { class: "demo-note" }, "デモデータを表示中（設定で Workers URL を登録すると実データになります）");
}
