/* 日程・結果：リスト表示 / カレンダー表示を切替（日本時間） */
import { getMatches } from "../api.js";
import { el, clear, loading, jst, isLive, isDone, STATUS_LABEL, demoNote, empty, crest } from "../util.js";

const DOW = ["日", "月", "火", "水", "木", "金", "土"];
let mode = "list";            // "list" | "calendar"
let calRef = null;            // カレンダーで表示中の月（Dateの1日）
let selectedDay = null;       // 選択中の日(YYYY-MM-DD)

/* ---- 共通：試合カード ---- */
function matchCard(m) {
  const t = jst(m.utcDate);
  const live = isLive(m), done = isDone(m);

  let center;
  if (live || done) {
    center = el("div", { class: "match__center" }, [
      el("div", { class: "match__score" }, `${m.score.home ?? 0} - ${m.score.away ?? 0}`),
      live ? el("span", { class: "badge-live" }, `${m.minute ?? ""}'`)
           : el("div", { class: "match__meta" }, "終了"),
    ]);
  } else {
    center = el("div", { class: "match__center" }, [
      el("div", { class: "match__time" }, t.timeStr),
      el("div", { class: "match__meta" }, STATUS_LABEL[m.status] || "予定"),
    ]);
  }

  return el("div", { class: "match" + (live ? " match--live" : "") }, [
    el("div", { class: "match__side" }, [crest(m.homeTeam, "md"), el("div", { class: "match__team" }, m.homeTeam.name)]),
    center,
    el("div", { class: "match__side match__side--away" }, [crest(m.awayTeam, "md"), el("div", { class: "match__team" }, m.awayTeam.name)]),
  ]);
}

/* ---- リスト表示 ---- */
function renderList(host, matches) {
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
  host.appendChild(list);
}

/* ---- カレンダー表示 ---- */
function dayResult(m) {
  if (isLive(m)) return "live";
  if (!isDone(m)) return "sched";
  if (m.score.home > m.score.away) return "win";
  if (m.score.home < m.score.away) return "lose";
  return "draw";
}

// 日本時間のYYYY-MM-DDキー
function jstKey(d) {
  return d.toLocaleDateString("ja-JP", { timeZone: "Asia/Tokyo", year: "numeric", month: "2-digit", day: "2-digit" });
}

function renderCalendar(host, matches) {
  // 月内の試合を日付キーでまとめる
  const byDay = new Map();
  for (const m of matches) {
    const key = jstKey(new Date(m.utcDate));
    if (!byDay.has(key)) byDay.set(key, []);
    byDay.get(key).push(m);
  }

  // 初期表示月：今日。selectedDay未設定なら最初の試合月に寄せる
  if (!calRef) {
    const today = new Date();
    calRef = new Date(today.getFullYear(), today.getMonth(), 1);
  }

  const year = calRef.getFullYear(), month = calRef.getMonth();
  const todayKey = jstKey(new Date());

  // ヘッダ（月移動）
  const head = el("div", { class: "cal-head" }, [
    el("div", { class: "cal-head__title" }, `${year}年 ${month + 1}月`),
    el("div", { class: "cal-nav" }, [
      el("button", { "aria-label": "前の月", onclick: () => { calRef = new Date(year, month - 1, 1); rerender(host, matches); } }, "‹"),
      el("button", { "aria-label": "今月", onclick: () => { calRef = new Date(new Date().getFullYear(), new Date().getMonth(), 1); rerender(host, matches); } }, "•"),
      el("button", { "aria-label": "次の月", onclick: () => { calRef = new Date(year, month + 1, 1); rerender(host, matches); } }, "›"),
    ]),
  ]);
  host.appendChild(head);

  // グリッド
  const grid = el("div", { class: "cal-grid" });
  for (const d of DOW) grid.appendChild(el("div", { class: "cal-dow" }, d));

  const first = new Date(year, month, 1);
  const startPad = first.getDay();                 // 月初の曜日(0=日)
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells = startPad + daysInMonth;
  const rows = Math.ceil(cells / 7) * 7;

  for (let i = 0; i < rows; i++) {
    const dayNum = i - startPad + 1;
    const inMonth = dayNum >= 1 && dayNum <= daysInMonth;
    const cellDate = new Date(year, month, dayNum);
    const key = inMonth ? jstKey(cellDate) : null;
    const dayMatches = key ? (byDay.get(key) || []) : [];

    const cell = el("div", {
      class: "cal-cell" + (inMonth ? "" : " cal-cell--out")
        + (key === todayKey ? " cal-cell--today" : "")
        + (dayMatches.length ? " cal-cell--match" : "")
        + (key && key === selectedDay ? " is-selected" : ""),
    }, [ inMonth ? el("div", { class: "cal-cell__day" }, String(dayNum)) : "" ]);

    for (const m of dayMatches) {
      cell.appendChild(el("div", { class: "cal-dot cal-dot--" + dayResult(m) }));
    }
    if (dayMatches.length) {
      cell.addEventListener("click", () => {
        selectedDay = (selectedDay === key) ? null : key;
        rerender(host, matches);
      });
    }
    grid.appendChild(cell);
  }
  host.appendChild(grid);

  // 選択日の試合詳細
  if (selectedDay && byDay.has(selectedDay)) {
    const wrap = el("div", { class: "cal-selected-day" });
    for (const m of byDay.get(selectedDay)) wrap.appendChild(matchCard(m));
    host.appendChild(wrap);
  } else {
    host.appendChild(el("p", { class: "cal-hint" }, "● の付いた日をタップすると試合が表示されます"));
  }
}

/* ---- 再描画（モード内の更新用） ---- */
let _root = null, _matches = null, _source = null;
function rerender(bodyHost, matches) {
  clear(bodyHost);
  if (mode === "list") renderList(bodyHost, matches);
  else renderCalendar(bodyHost, matches);
}

export async function render(root) {
  clear(root);
  root.appendChild(loading());

  const { data: matches, source } = await getMatches();
  _root = root; _matches = matches; _source = source;
  clear(root);

  // ヘッダ＋トグル
  root.appendChild(el("div", { class: "section-head" }, [
    el("h2", {}, "日程・結果"),
    el("div", { class: "view-toggle" }, [
      el("button", { class: mode === "list" ? "is-active" : "", onclick: () => setMode("list") }, "リスト"),
      el("button", { class: mode === "calendar" ? "is-active" : "", onclick: () => setMode("calendar") }, "カレンダー"),
    ]),
  ]));

  if (!matches.length) {
    root.appendChild(empty("📅", "試合データがありません。"));
    return;
  }

  const body = el("div", { class: "schedule-body" });
  root.appendChild(body);
  rerender(body, matches);

  if (source === "demo") root.appendChild(demoNote());
}

function setMode(next) {
  if (mode === next) return;
  mode = next;
  render(_root); // ヘッダのアクティブ表示も更新するため全体再描画
}

export function cleanup() {}
