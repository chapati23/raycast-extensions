# Artwork and fallback icons

## Sub-features

Release artwork, missing covers and portraits, magnifiers on unresolved chart rows.

## How to get to it (user POV)

Search for a specific mix and compare row icons. Open an artist’s chart and identify which ranks still need a search.

## Driving it with verify

Run `"$V" mixes` and inspect `results.png`. The DJ Tennis row has a real Beatport CDN URL. The Chaim row has no image and should show a music note. In the `"$V" chart` capture, ANOTR has a person icon and the unresolved sixth rank has a magnifier. Check that row actions still work regardless of image availability.

## Gotchas

The screenshots require visual inspection. The driver checks row identity, order and actions. It does not classify pixels or measure image latency. The CDN can be slow or unavailable. If the expected cover is absent, retain the capture and report image loading as unverified. Use the track tests for malformed URLs, the stock artist silhouette and ambiguous chart artwork.
