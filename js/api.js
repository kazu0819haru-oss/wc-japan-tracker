/* =========================================================
   API ラッパ
   Cloudflare Workers 中継を叩く。未設定・失敗時は
   キャッシュ → サンプルデータ の順でフォールバックする。

   返り値は常に { data, source } 形式。
   source: "live" | "cache" | "demo"
   ========================================================= */

import { settings, cacheSet, cacheGet } from "./store.js";
import { sampleMatches, sampleStreams } from "./sampleData.js";

const TIMEOUT = 8000;

async function fetchJson(path) {
  const base = settings.workerUrl;
  if (!base) throw new Error("no-worker");

  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), TIMEOUT);
  try {
    const res = await fetch(base.replace(/\/$/, "") + path, { signal: ctrl.signal });
    if (!res.ok) throw new Error("http-" + res.status);
    return await res.json();
  } finally {
    clearTimeout(t);
  }
}

/**
 * 共通ロジック：API取得→成功でキャッシュ、失敗でキャッシュ/デモ。
 * @param {string} key       キャッシュキー
 * @param {string} path      Workersのパス
 * @param {*}      demo       デモデータ
 * @param {(json:any)=>any} pick  レスポンスから必要部分を取り出す
 */
async function load(key, path, demo, pick = (x) => x) {
  try {
    const json = await fetchJson(path);
    const data = pick(json);
    cacheSet(key, data);
    return { data, source: "live" };
  } catch (err) {
    const cached = cacheGet(key);
    if (cached) return { data: cached.data, source: "cache" };
    return { data: demo, source: "demo" };
  }
}

export function getMatches() {
  return load("matches", "/api/matches", sampleMatches, (j) => j.matches || j);
}

export function getLive() {
  // ライブ中の試合のみ
  return load("live", "/api/live", sampleMatches.filter(m => m.status === "IN_PLAY" || m.status === "PAUSED"), (j) => j.matches || j);
}

export function getStreams() {
  return load("streams", "/api/streams", sampleStreams, (j) => j.items || j);
}
