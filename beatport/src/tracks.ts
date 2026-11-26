import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";

interface Page {
  id: string;
  title: string;
  url: string;
}

export interface Track extends Page {
  artist?: string;
  releaseDetail?: string;
}

export interface ChartEntry {
  rank: number;
  title: string;
  credits: string;
  trackUrl?: string;
}

export interface Results {
  profile?: Page;
  chart: ChartEntry[];
  tracks: Track[];
}

interface Hit {
  url: string;
  title: string;
  text?: string;
}

function nameKey(value: string) {
  return value.normalize("NFKD").replace(/\p{M}/gu, "").replace(/[’‘]/g, "'").replace(/\s+/g, " ").trim().toLowerCase();
}

function creditedTo(credits: string, artist: string) {
  return [credits, ...credits.split(/\s*[,•]\s*/)].some((credit) => nameKey(credit) === nameKey(artist));
}

function topTen(text: string, artist: string): ChartEntry[] {
  const body = text.split(/^#{1,3}\s+Top (?:Ten|10) Tracks\s*$/im)[1]?.split(/^#{1,3}\s/m)[0] ?? "";
  const lines = body
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  const chart: ChartEntry[] = [];
  for (const [index, line] of lines.entries()) {
    if (!/^(?:[1-9]|10)$/.test(line)) continue;
    const rank = Number(line);
    const title = lines[index + 1];
    const credits = lines[index + 2];
    // The index often drops individual lines. Require adjacent rank, title and artist credit.
    if (!title || !credits || /^\d+$/.test(title) || !creditedTo(credits, artist) || creditedTo(title, artist))
      continue;
    if (chart.some((entry) => entry.rank === rank)) continue;
    chart.push({ rank, title, credits });
  }
  return chart.sort((a, b) => a.rank - b.rank);
}

const releaseFormat = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
  year: "numeric",
  timeZone: "UTC",
});

function releaseDate(text?: string): string | undefined {
  const match = text?.match(/^Released:[ \t]*\r?\n\s*(\d{1,2})\/(\d{1,2})\/(\d{4}|\d{2})[ \t]*$/m);
  if (!match) return;
  const month = Number(match[1]);
  const day = Number(match[2]);
  // Beatport's US date format uses two or four digits for the release year.
  const year = match[3].length === 4 ? Number(match[3]) : Number(match[3]) + (Number(match[3]) >= 70 ? 1900 : 2000);
  const date = new Date(Date.UTC(year, month - 1, day));
  if (date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day)
    return releaseFormat.format(date);
}

function labelDuplicates(visible: Track[], dates: Map<string, string | undefined>) {
  for (const track of visible) {
    const peers = visible.filter(
      (other) =>
        nameKey(other.title) === nameKey(track.title) && nameKey(other.artist ?? "") === nameKey(track.artist ?? ""),
    );
    if (peers.length < 2) continue;
    const date = dates.get(track.id);
    track.releaseDetail =
      date && peers.every((other) => other.id === track.id || dates.get(other.id) !== date) ? date : "ID " + track.id;
  }
}

export function parseResults(hits: Hit[], query: string): Results {
  const tracks = new Map<string, Track>();
  const dates = new Map<string, string | undefined>();
  let profile: Page | undefined;
  let chart: ChartEntry[] = [];
  for (const hit of hits) {
    if (!URL.canParse(hit.url)) continue;
    const page = new URL(hit.url);
    if (!["https://beatport.com", "https://www.beatport.com"].includes(page.origin) || page.username || page.password)
      continue;
    const path = /^\/(?:[a-z]{2}\/)?(track|artist)\/([^/]+)\/([1-9]\d*)\/?$/.exec(page.pathname);
    if (!path) continue;
    const [, kind, slug, id] = path;
    const url = `https://www.beatport.com/${kind}/${slug}/${id}`;

    if (kind === "artist") {
      const title =
        hit.text?.match(/^# ([^\r\n]+)$/m)?.[1]?.trim() ??
        hit.title.replace(/\s+Music (?:& Downloads on Beatport|downloads?.*)$/i, "").trim();
      if (nameKey(title) !== nameKey(query) || (profile && profile.id !== id)) continue;
      profile ??= { id, title, url };
      const entries = topTen(hit.text ?? "", title);
      if (entries.length > chart.length) chart = entries;
      continue;
    }

    const name = hit.title
      .replace(/\s*\|[^|]*Beatport\s*$/i, "")
      .replace(/\s+\[[^\]]+\]$/, "")
      .trim();
    if (!name || tracks.has(id)) continue;
    const split = name.indexOf(" - ");
    const hasArtist = split > 0 && split + 3 < name.length;
    dates.set(id, releaseDate(hit.text));
    tracks.set(id, {
      id,
      url,
      title: hasArtist ? name.slice(split + 3) : name,
      artist: hasArtist ? name.slice(0, split) : undefined,
    });
  }
  const matches = [...tracks.values()].filter((track) => !profile || creditedTo(track.artist ?? "", profile.title));
  const linked = new Set<string>();
  for (const entry of chart) {
    const candidates = matches.filter(
      (track) =>
        nameKey(track.title.replace(/[()]/g, "")) === nameKey(entry.title.replace(/[()]/g, "")) &&
        nameKey(track.artist ?? "") === nameKey(entry.credits),
    );
    if (candidates.length === 1) {
      entry.trackUrl = candidates[0].url;
      linked.add(candidates[0].id);
    }
  }
  const visible = matches.filter((track) => !linked.has(track.id)).slice(0, 10);
  labelDuplicates(visible, dates);
  return { profile, chart, tracks: visible };
}

function isHit(value: unknown): value is Hit {
  return (
    typeof value === "object" &&
    value !== null &&
    "url" in value &&
    typeof value.url === "string" &&
    "title" in value &&
    typeof value.title === "string" &&
    (!("text" in value) || typeof value.text === "string")
  );
}

export async function searchBeatport(query: string, signal: AbortSignal): Promise<Results> {
  const client = new Client({ name: "beatport-search-raycast", version: "0.2.0" });
  const transport = new StreamableHTTPClientTransport(new URL("https://mcp.exa.ai/mcp?tools=web_search_advanced_exa"));
  const options = { signal, timeout: 15000 };
  try {
    await client.connect(transport, options);
    signal.throwIfAborted();
    const result = await client.callTool(
      {
        name: "web_search_advanced_exa",
        arguments: {
          query,
          type: "lite",
          includeDomains: ["beatport.com/artist", "beatport.com/track"],
          numResults: 18,
          textMaxCharacters: 12000,
        },
      },
      undefined,
      options,
    );
    if (!Array.isArray(result.content)) throw new Error("Exa returned an unexpected response.");
    const text = result.content.find((item) => item.type === "text")?.text;
    if (result.isError || typeof text !== "string")
      throw new Error(/rate.limit|429/i.test(text ?? "") ? "Exa rate limit" : "Exa search failed");
    const data = JSON.parse(text);
    if (!Array.isArray(data.results)) throw new Error("Exa returned an unexpected response.");
    return parseResults(data.results.filter(isHit), query);
  } finally {
    await client.close();
  }
}
