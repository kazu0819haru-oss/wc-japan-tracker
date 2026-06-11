/* 観戦：YouTubeのライブ配信（実況・同時視聴系）一覧 ＋ 公式放送ガイド */
import { getStreams } from "../api.js";
import { el, clear, loading, empty, demoNote } from "../util.js";

// 公式放送ガイド（固定）。配信元は大会により変わるため目安。
const GUIDES = [
  { name: "ABEMA", note: "無料ライブ配信が中心", url: "https://abema.tv/" },
  { name: "NHK", note: "地上波 / NHKプラス", url: "https://www.nhk.jp/p/sports/" },
  { name: "DAZN", note: "見逃し・ハイライト", url: "https://www.dazn.com/ja-JP/" },
  { name: "民放各局", note: "中継スケジュール確認", url: "https://www.google.com/search?q=" + encodeURIComponent("ワールドカップ 日本戦 放送 テレビ") },
];

function streamCard(s) {
  const thumb = el("div", { class: "stream__thumb" }, el("span", { class: "stream__live" }, "LIVE"));
  if (s.thumbnail) {
    thumb.style.backgroundImage = `url("${s.thumbnail}")`;
    thumb.style.backgroundSize = "cover";
    thumb.style.backgroundPosition = "center";
  }
  return el("a", { class: "stream", href: s.url, target: "_blank", rel: "noopener" }, [
    thumb,
    el("div", { class: "stream__body" }, [
      el("div", { class: "stream__title" }, s.title),
      el("div", { class: "stream__chan" }, s.channel),
    ]),
  ]);
}

export async function render(root) {
  clear(root);
  root.appendChild(loading());

  const { data: streams, source } = await getStreams();
  clear(root);

  // ライブ配信
  root.appendChild(el("div", { class: "section-head" }, [
    el("h2", {}, "ライブ配信中"),
    el("span", { class: "sub" }, "実況・同時視聴"),
  ]));
  if (streams.length) {
    const list = el("div", { class: "stagger" });
    for (const s of streams) list.appendChild(streamCard(s));
    root.appendChild(list);
  } else {
    root.appendChild(empty("🔍", "現在、配信は見つかりませんでした。試合時間帯に再度ご確認ください。"));
  }

  // 公式放送ガイド
  root.appendChild(el("div", { class: "section-head" }, [el("h2", {}, "どこで観る？")]));
  const grid = el("div", { class: "guide-grid" });
  for (const g of GUIDES) {
    grid.appendChild(
      el("a", { class: "guide", href: g.url, target: "_blank", rel: "noopener" }, [
        el("b", {}, g.name),
        el("span", {}, g.note),
      ])
    );
  }
  root.appendChild(grid);

  if (source === "demo") root.appendChild(demoNote());
}

export function cleanup() {}
