/* 日程・結果：日本代表の全試合を日付ごとに時系列表示（日本時間） */
import { getMatches } from "../api.js";
import { el, clear, loading, jst, isLive, isDone, STATUS_LABEL, demoNote, empty } from "../util.js";

function matchCard(m) {
  const t = jst(m.utcDate);
  const live = isLive(m), done = isDone(m);

  let center;
  if (live || done) {
    center = el("div", { class: "match__center" }, [
      el("div", { class: "match__score" }, `${m.score.home ?? 0} - ${m.score.away ?? 0}`),
      live
        ? el("span", { class: "badge-live" }, `${m.minute ?? ""}'`)
        : el("div", { class: "match__meta" }, "終了"),
    ]);
  } else {
    center = el("div", { class: "match__center" }, [
      el("div", { class: "match__time" }, t.timeStr),
      el("div", { class: "match__meta" }, STATUS_LABEL[m.status] || "予定"),
    ]);
  }

  return el("div", { class: "match" + (live ? " match--live" : "") }, [
    el("div", { class: "match__side" }, [
      el("div", { class: "match__crest" }, m.homeTeam.crest || "⚽"),
      el("div", { class: "match__team" }, m.homeTeam.name),
    ]),
    center,
    el("div", { class: "match__side match__side--away" }, [
      el("div", { class: "match__crest" }, m.awayTeam.crest || "⚽"),
      el("div", { class: "match__team" }, m.awayTeam.name),
    ]),
  ]);
}

export async function render(root) {
  clear(root);
  root.appendChild(loading());

  const { data: matches, source } = await getMatches();
  clear(root);

  root.appendChild(el("div", { class: "section-head" }, [
    el("h2", {}, "日程・結果"),
    el("span", { class: "sub" }, "日本時間表示"),
  ]));

  if (!matches.length) {
    root.appendChild(empty("📅", "試合データがありません。"));
    return;
  }

  const sorted = [...matches].sort((a, b) => new Date(a.utcDate) - new Date(b.utcDate));
  let lastDay = null;
  const list = el("div", {});
  for (const m of sorted) {
    const t = jst(m.utcDate);
    if (t.dayKey !== lastDay) {
      list.appendChild(el("div", { class: "day-divider" }, `${t.dateStr}　${m.competition}`));
      lastDay = t.dayKey;
    }
    list.appendChild(matchCard(m));
  }
  root.appendChild(list);

  if (source === "demo") root.appendChild(demoNote());
}

export function cleanup() {}
