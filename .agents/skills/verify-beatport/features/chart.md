# Artist profiles and ranked tracks

## Sub-features

Artist-first ordering, partial chart, resolved and unresolved ranks, nested mix search.

## How to get to it (user POV)

Search for `ANOTR`. Look below the artist profile for **Beatport Top Ten**. Choose **Find This Mix** on an unresolved entry to search with its credits and title.

## Driving it with verify

Run `"$V" chart`. In `chart.png`, the artist comes first. The two supplied ranks are **#4 Relax My Eyes Original Mix** and **#6 It's So Nice Extended Mix**. The full-chart link remains available. The unresolved row has the **Find mix** label. The driver opens its menu, activates **Find This Mix**, and requires **It's So Nice (Extended Mix)** on the resulting search screen. Compare `chart.png` and `find-mix.png` with the action log.

## Gotchas

The fixture has two ranks and one artist ID. Use the result-list and tracks tests for held selection during supplemental lookups, same-name artists, and ambiguous track links. Test Escape/back in Raycast when changing navigation code. A sparse live chart is valid when the provider returns fewer than ten positions.
