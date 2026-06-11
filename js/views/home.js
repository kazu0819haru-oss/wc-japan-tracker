/* ホーム：次の試合カウントダウン / ライブ中バナー / 直近結果 */
import { getMatches } from "../api.js";
import { el, clear, loading, jst, breakdown, isLive, isDone, demoNote, crest } from "../util.js";

let timer = null;

function teamBlock(team) {
  return el("div", { class: "team" }, [
    crest(team, "lg"),
    el("div", { class: "team__name" }, team.name),
  ]);
}

function countdownEls(target) {
  const wrap = el("div", { class: "countdown" });
  const units = [["日", "d"], ["時間", "h"], ["分", "m"], ["秒", "s"]];
  const refs = {};
  for (const [label, key] of units) {
    const b = el("b", {}, "0");
    refs[key] = b;
    wrap.appendChild(el("div", { class: "cd-unit" }, [b, el("span", {}, label)]));
  }
  function tick() {
    const bd = breakdown(target - Date.now());
    refs.d.textContent = bd.d;
    refs.h.textContent = String(bd.h).padStart(2, "0");
    refs.m.textContent = String(bd.m).padStart(2, "0");
    refs.s.textContent = String(bd.s).padStart(2, "0");
  }
  tick();
  clearInterval(timer);
  timer = setInterval(tick, 1000);
  return wrap;
}

export async function render(root) {
  clear(root);
  root.appendChild(loading());

  const { data: matches, source } = await getMatches();
  clear(root);

  const live = matches.find(isLive);
  const upcoming = matches
    .filter((m) => !isLive(m) && !isDone(m))
    .sort((a, b) => new Date(a.utcDate) - new Date(b.utcDate))[0];
  const recent = matches
    .filter(isDone)
    .sort((a, b) => new Date(b.utcDate) - new Date(a.utcDate))
    .slice(0, 3);

  // ライブ中バナー
  if (live) {
    const t = jst(live.utcDate);
    root.appendChild(
      el("div", { class: "hero" }, [
        el("span", { class: "hero__tag" }, "● 試合中 — ライブタブで詳細"),
        el("div", { class: "hero__match" }, [
          teamBlock(live.homeTeam),
          el("div", { class: "hero__vs" }, `${live.score.home ?? 0} - ${live.score.away ?? 0}`),
          teamBlock(live.awayTeam),
        ]),
        el("p", { class: "hero__when" }, [live.competition, " ", el("b", {}, `${live.minute ?? ""}'`)]),
      ])
    );
  }

  // 次の試合カウントダウン
  if (upcoming) {
    const t = jst(upcoming.utcDate);
    root.appendChild(el("div", { class: "section-head" }, [el("h2", {}, "次の試合"), el("span", { class: "sub" }, upcoming.competition)]));
    root.appendChild(
      el("div", { class: "hero" }, [
        el("span", { class: "hero__tag" }, "KICKOFF まで"),
        el("div", { class: "hero__match" }, [
          teamBlock(upcoming.homeTeam),
          el("div", { class: "hero__vs" }, "VS"),
          teamBlock(upcoming.awayTeam),
        ]),
        countdownEls(new Date(upcoming.utcDate).getTime()),
        el("p", { class: "hero__when" }, [el("b", {}, t.dateStr), ` ${t.timeStr} 〜（日本時間）`]),
      ])
    );
  } else if (!live) {
    root.appendChild(el("div", { class: "hero" }, [
      el("span", { class: "hero__tag" }, "SCHEDULE"),
      el("p", { class: "hero__when" }, "予定されている試合はまだありません。"),
    ]));
  }

  // 直近結果
  if (recent.length) {
    root.appendChild(el("div", { class: "section-head" }, [el("h2", {}, "直近の結果")]));
    const list = el("div", { class: "stagger" });
    for (const m of recent) {
      const t = jst(m.utcDate);
      const win = m.score.home > m.score.away, lose = m.score.home < m.score.away;
      list.appendChild(
        el("div", { class: "match" }, [
          el("div", { class: "match__side" }, [
            crest(m.homeTeam, "md"),
            el("div", { class: "match__team" }, m.homeTeam.name),
          ]),
          el("div", { class: "match__center" }, [
            el("div", { class: "match__score" }, `${m.score.home} - ${m.score.away}`),
            el("div", { class: "match__meta" }, win ? "WIN" : lose ? "LOSE" : "DRAW"),
          ]),
          el("div", { class: "match__side match__side--away" }, [
            crest(m.awayTeam, "md"),
            el("div", { class: "match__team" }, m.awayTeam.name),
          ]),
        ])
      );
    }
    root.appendChild(list);
  }

  if (source === "demo") root.appendChild(demoNote());
}

export function cleanup() { clearInterval(timer); }
