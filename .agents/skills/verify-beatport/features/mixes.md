# Track and remix search

## Sub-features

Exact artist/title/version matching, related versions, track actions, live retrieval.

## How to get to it (user POV)

Open Search Beatport. Type `Walls DJ Tennis Remix Art Department`, or pass the same query through Raycast’s fallback command. Open Actions on the DJ Tennis version.

## Driving it with verify

Run `"$V" mixes`. The driver opens the command with the query, compares the native vertical positions of both rows, and opens the exact row’s menu. Inspect `results.png`: **Walls (DJ Tennis Remix)** belongs under **Matching Mixes** and **Walls (Chaim Remix)** under **Related Tracks**. Check that the action log reaches **Copy Track URL**.

Run `"$V" live` after changing the Exa request. This sends the same query and requires the exact track and its copy action. Live results can include different related tracks.

## Gotchas

A menu label does not prove the copied URL. The parser tests cover Beatport IDs, duplicate releases and canonical URLs. The native driver uses the fallback-text entry point. If editing typing or debounce behavior, also open Search Beatport directly, type the query, then replace it with another query while the first search is pending. Only results for the current text should appear.
