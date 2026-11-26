import { describe, expect, it } from "vitest";
import { parseResults } from "./tracks";

const profile = {
  url: "https://www.beatport.com/artist/anotr/498574",
  title: "ANOTR Music & Downloads on Beatport",
  text: "# ANOTR\n\n## Top Ten Tracks\n\n3\n\nANOTR, 3DDY\n\nNO ART\n\n4\n\nRelax My Eyes Original Mix\n\nANOTR, Abel Balder\n\n6\n\nIt's So Nice Extended Mix\n\nANOTR, 3DDY\n\n## Charts\n\n8\n\nUnrelated chart\n\nANOTR",
};
const track = {
  url: "https://beatport.com/es/track/relax-my-eyes/2?ref=test",
  title: "ANOTR, Abel Balder - Relax My Eyes (Original Mix) [NO ART] | Music & Downloads on Beatport",
};
const other = { url: "https://www.beatport.com/track/radio/3", title: "Another Artist - Relax My Eyes (Radio Edit)" };

describe("Beatport results", () => {
  it("promotes an exact artist and preserves only positions with adjacent titles and credits in its chart", () => {
    const result = parseResults(
      [other, track, profile, { ...profile, url: "https://www.beatport.com/artist/anotr/123", text: "# ANOTR" }],
      "anotr",
    );
    expect(result.profile?.id).toBe("498574");
    expect(result.chart.map(({ rank, title }) => [rank, title])).toEqual([
      [4, "Relax My Eyes Original Mix"],
      [6, "It's So Nice Extended Mix"],
    ]);
    expect(result.chart[0].trackUrl).toBe("https://www.beatport.com/track/relax-my-eyes/2");
    expect(result.chart[1].trackUrl).toBeUndefined();
    expect(result.tracks).toEqual([]);
  });

  it("keeps track searches in provider order and deduplicates aliases by track ID", () => {
    const result = parseResults(
      [other, profile, track, { ...track, url: "https://www.beatport.com/track/t/2" }],
      "ANOTR Relax My Eyes",
    );
    expect(result.profile).toBeUndefined();
    expect(result.chart).toEqual([]);
    expect(result.tracks.map((t) => t.id)).toEqual(["3", "2"]);
    expect(result.tracks[1].url).toBe("https://www.beatport.com/track/relax-my-eyes/2");
  });

  it("matches unaccented artist queries and handles missing chart text", () => {
    const result = parseResults(
      [{ title: "Ben Böhmer Music & Downloads on Beatport", url: "https://www.beatport.com/artist/ben-bohmer/1" }],
      "Ben Bohmer",
    );
    expect(result.profile?.title).toBe("Ben Böhmer");
    expect(result.chart).toEqual([]);
  });

  it("labels duplicate mixes with distinct release dates, falling back to IDs when dates collide or are absent", () => {
    const mix = { title: "deadmau5 - Strobe (Club Edit) [mau5trap] | Music & Downloads on Beatport" };
    const hits = ["12/24/14", "11/24/14", "11/24/14", "2/31/14"].map((date, index) => ({
      ...mix,
      url: "https://www.beatport.com/track/strobe/" + (index + 1),
      text: "# Strobe Club Edit\n\nReleased:\n\n" + date,
    }));
    const result = parseResults([...hits, { ...other, url: "https://www.beatport.com/track/radio/99" }], "Strobe");
    expect(result.tracks.map((track) => track.releaseDetail)).toEqual([
      "24 Dec 2014",
      "ID 2",
      "ID 3",
      "ID 4",
      undefined,
    ]);
  });

  it("excludes artist subpages, unsafe links and unrelated result types", () => {
    const urls = [
      profile.url + "/tracks",
      "https://beatport.com.example.org/track/strobe/2",
      "https://beatport.com@unrelated.example/track/strobe/2",
      "http://beatport.com/track/strobe/2",
      "bad",
    ];
    expect(
      parseResults(
        urls.map((url) => ({ ...profile, url })),
        "ANOTR",
      ),
    ).toEqual({ profile: undefined, chart: [], tracks: [] });
  });
});
