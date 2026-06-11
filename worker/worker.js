/* =========================================================
   Cloudflare Worker — API中継
   役割：
     1. APIキーを隠す（ブラウザに出さない）
     2. CORSを解決する
     3. football-data.org / YouTube Data API をアプリ形式に整形
     4. 短時間キャッシュでレート制限を回避

   必要なシークレット（wrangler secret put で登録）：
     FOOTBALL_TOKEN   football-data.org の X-Auth-Token
     YOUTUBE_KEY      YouTube Data API v3 のキー
   環境変数（wrangler.toml [vars]）：
     TEAM_ID          football-data.org の日本代表チームID（既定 765）
     STREAM_QUERY     YouTube検索クエリ（既定 "日本代表 同時視聴 実況 ライブ"）
   ========================================================= */

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

function json(data, status = 200, cacheSec = 0) {
  const headers = { "Content-Type": "application/json; charset=utf-8", ...CORS };
  if (cacheSec) headers["Cache-Control"] = `public, max-age=${cacheSec}`;
  return new Response(JSON.stringify(data), { status, headers });
}

/* ---- football-data の試合 → アプリ形式 ---- */
function mapMatch(m) {
  return {
    id: m.id,
    utcDate: m.utcDate,
    status: m.status,
    competition: m.competition?.name || "試合",
    stage: m.stage || "",
    homeTeam: { name: m.homeTeam?.shortName || m.homeTeam?.name || "未定", crest: m.homeTeam?.crest || "" },
    awayTeam: { name: m.awayTeam?.shortName || m.awayTeam?.name || "未定", crest: m.awayTeam?.crest || "" },
    score: {
      home: m.score?.fullTime?.home ?? m.score?.halfTime?.home ?? null,
      away: m.score?.fullTime?.away ?? m.score?.halfTime?.away ?? null,
    },
    minute: m.minute ?? null,
    scorers: (m.goals || []).map((g) => ({
      team: g.team?.id === m.homeTeam?.id ? "home" : "away",
      player: g.scorer?.name || "得点",
      minute: g.minute ?? "",
    })),
  };
}

async function fetchMatches(env) {
  const teamId = env.TEAM_ID || "765";
  const res = await fetch(`https://api.football-data.org/v4/teams/${teamId}/matches?limit=50`, {
    headers: { "X-Auth-Token": env.FOOTBALL_TOKEN || "" },
    cf: { cacheTtl: 60, cacheEverything: true },
  });
  if (!res.ok) throw new Error("football-data " + res.status);
  const data = await res.json();
  return (data.matches || []).map(mapMatch);
}

/* ---- YouTube ライブ配信検索 → アプリ形式 ---- */
async function fetchStreams(env) {
  const q = env.STREAM_QUERY || "日本代表 同時視聴 実況 ライブ";
  const url = new URL("https://www.googleapis.com/youtube/v3/search");
  url.searchParams.set("part", "snippet");
  url.searchParams.set("eventType", "live");
  url.searchParams.set("type", "video");
  url.searchParams.set("q", q);
  url.searchParams.set("maxResults", "12");
  url.searchParams.set("relevanceLanguage", "ja");
  url.searchParams.set("regionCode", "JP");
  url.searchParams.set("key", env.YOUTUBE_KEY || "");

  const res = await fetch(url, { cf: { cacheTtl: 120, cacheEverything: true } });
  if (!res.ok) throw new Error("youtube " + res.status);
  const data = await res.json();
  return (data.items || [])
    .filter((it) => it.id?.videoId)
    .map((it) => ({
      videoId: it.id.videoId,
      title: it.snippet?.title || "",
      channel: it.snippet?.channelTitle || "",
      thumbnail: it.snippet?.thumbnails?.medium?.url || "",
      url: "https://www.youtube.com/watch?v=" + it.id.videoId,
    }));
}

export default {
  async fetch(request, env) {
    if (request.method === "OPTIONS") return new Response(null, { headers: CORS });
    const { pathname } = new URL(request.url);

    try {
      if (pathname === "/api/matches") {
        return json({ matches: await fetchMatches(env) }, 200, 60);
      }
      if (pathname === "/api/live") {
        const all = await fetchMatches(env);
        const live = all.filter((m) => m.status === "IN_PLAY" || m.status === "PAUSED");
        return json({ matches: live }, 200, 20);
      }
      if (pathname === "/api/streams") {
        return json({ items: await fetchStreams(env) }, 200, 120);
      }
      if (pathname === "/" || pathname === "/api") {
        return json({ ok: true, endpoints: ["/api/matches", "/api/live", "/api/streams"] });
      }
      return json({ error: "not found" }, 404);
    } catch (err) {
      return json({ error: String(err.message || err) }, 502);
    }
  },
};
