import { describe, expect, it } from "vitest";
import { resultSections, updateList } from "./result-list";
import type { Results } from "./tracks";

const profile = { id: "1", title: "Artist", url: "https://www.beatport.com/artist/artist/1" };
const entry = { rank: 4, title: "Song", credits: "Artist" };
const track = { id: "2", title: "Song", artist: "Artist", url: "https://www.beatport.com/track/song/2" };
const initial: Results = { profile, chart: [entry], tracks: [track] };
const settled: Results = { profile, chart: [{ ...entry, trackUrl: track.url }], tracks: [] };

describe("progressive Beatport search", () => {
  it("keeps the selected lookup action when its chart rank becomes a direct link", () => {
    const previous = { ...updateList(undefined, "q", initial, true), selectedId: "rank-1-4" };
    const list = updateList(previous, "q", settled, false);
    expect(list.selectedId).toBe(previous.selectedId);
    expect(list.sections[1].rows[0]).toMatchObject({ kind: "rank", entry: { trackUrl: undefined } });
    expect(list.settledSections?.[1].rows[0]).toMatchObject({ kind: "rank", entry: { trackUrl: track.url } });
  });
  it("keeps a selected track accessible when deduplication moves it to the chart", () => {
    const previous = { ...updateList(undefined, "q", initial, true), selectedId: "track-2" };
    const list = updateList(previous, "q", settled, false);
    expect(list.sections.flatMap((s) => s.rows).map((r) => r.id)).toContain("track-2");
    expect(list.settledSections?.flatMap((s) => s.rows).map((r) => r.id)).not.toContain("track-2");
    expect(updateList(previous, "different", settled, false).selectedId).toBe("artist-1");
  });
  it("shows the chart link at zero ranks and keeps the catalog action when a match arrives", () => {
    expect(resultSections({ ...initial, chart: [] }, false)[1]).toMatchObject({
      subtitle: "No ranks shown",
      rows: [{ kind: "chart" }],
    });
    const related = { tracks: [track], chart: [], mixSearch: true };
    const previous = updateList(undefined, "song", related, true);
    const list = updateList(previous, "song", { ...related, tracks: [{ ...track, match: "exact" }] }, false);
    expect(list.selectedId).toBe("catalog");
    expect(list.sections[0].rows[0].id).toBe("catalog");
    expect(list.settledSections?.[0].title).toBe("Matching Mixes");
  });
});
