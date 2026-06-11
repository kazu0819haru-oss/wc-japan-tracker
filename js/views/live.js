/* ライブ：試合中のスコア・経過を自動更新（数十秒ごとポーリング） */
import { getLive } from "../api.js";
import { el, clear, loading, jst, empty, demoNote } from "../util.js";

const POLL_MS = 30000;
let poll = null;

function board(m) {
  const homeScorers = (m.scorers || []).filter((s) => s.team === "home");
  const awayScorers = (m.scorers || []).filter((s) => s.team === "away");

  const scorerList = (m.scorers || []).length
    ? el("div", { class: "scorers" }, (m.scorers || []).map((s) =>
        el("div", { class: "scorer" }, [
          el("b", {}, `${s.player}`),
          `　${s.minute}' (${s.team === "home" ? m.homeTeam.name : m.awayTeam.name})`,
        ])
      ))
    : null;

  return el("div", { class: "live-board" }, [
    el("span", { class: "badge-live" }, `LIVE ${m.minute ?? ""}'`),
    el("div", { class: "live-board__score" }, [
      el("div", {}, [
        el("div", { class: "live-board__num" }, String(m.score.home ?? 0)),
        el("div", { class: "live-board__team" }, m.homeTeam.name),
      ]),
      el("div", { class: "live-board__colon" }, ":"),
      el("div", {}, [
        el("div", { class: "live-board__num" }, String(m.score.away ?? 0)),
        el("div", { class: "live-board__team" }, m.awayTeam.name),
      ]),
    ]),
    el("p", { class: "match__meta" }, m.competition),
    scorerList,
  ].filter(Boolean));
}

async function refresh(root) {
  const { data: lives, source } = await getLive();
  clear(root);

  root.appendChild(el("div", { class: "section-head" }, [
    el("h2", {}, "ライブ"),
    el("span", { class: "sub" }, "自動更新 30秒"),
  ]));

  if (!lives.length) {
    root.appendChild(empty("📡", "現在ライブ中の試合はありません。試合開始時刻になると自動で表示されます。"));
    return;
  }
  const wrap = el("div", { class: "stagger" });
  for (const m of lives) wrap.appendChild(board(m));
  root.appendChild(wrap);

  if (source === "demo") root.appendChild(demoNote());
}

export async function render(root) {
  clear(root);
  root.appendChild(loading());
  await refresh(root);
  clearInterval(poll);
  poll = setInterval(() => refresh(root), POLL_MS);
}

export function cleanup() { clearInterval(poll); }
