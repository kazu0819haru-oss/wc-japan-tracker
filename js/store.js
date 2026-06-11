/* =========================================================
   ローカルストレージのラッパ
   - 設定（Workers URL）の保存
   - APIレスポンスのキャッシュ（オフライン/失敗時のフォールバック）
   ========================================================= */

const PREFIX = "sbt:";

export const settings = {
  get workerUrl() {
    return (localStorage.getItem(PREFIX + "workerUrl") || "").trim();
  },
  set workerUrl(v) {
    localStorage.setItem(PREFIX + "workerUrl", (v || "").trim());
  },
};

export function cacheSet(key, data) {
  try {
    localStorage.setItem(
      PREFIX + "cache:" + key,
      JSON.stringify({ at: Date.now(), data })
    );
  } catch (_) { /* 容量超過などは無視 */ }
}

export function cacheGet(key) {
  try {
    const raw = localStorage.getItem(PREFIX + "cache:" + key);
    if (!raw) return null;
    return JSON.parse(raw); // { at, data }
  } catch (_) {
    return null;
  }
}
