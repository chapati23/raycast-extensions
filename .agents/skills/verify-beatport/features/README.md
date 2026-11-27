# Beatport feature map

Set `V=.agents/skills/verify-beatport/scripts/verify` in the repository root. Each invocation prints a separate evidence directory.

| Feature | Native journey | Evidence to inspect |
| --- | --- | --- |
| [Track and remix search](mixes.md) | `"$V" mixes`, `"$V" live` | Exact and related mix rows, track actions |
| [Artist profiles and ranked tracks](chart.md) | `"$V" chart` | Profile, partial chart, nested track search |
| [Artwork and fallback icons](artwork.md) | `"$V" mixes`, `"$V" chart` | Release cover, music note, person and magnifier |
| [Provider recovery](recovery.md) | `"$V" retry` | Rate limit followed by an empty result after retry |
