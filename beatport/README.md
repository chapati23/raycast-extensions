# Beatport Search for Raycast

Open **Search Beatport**, then type an artist or track name. An exact artist-name match puts the Beatport artist profile first. The **Beatport Top Ten** section preserves the positions, titles and credits visible in Exa’s copy of the profile. Press Return to open a chart entry when the index also contains a unique track page with the same mix and credits. Otherwise choose **Find This Mix** to look up a chart entry, then press Escape to return to the artist. The heading reports how many of the ten positions are available. **View Full Top Ten on Beatport** opens the chart when some ranks are missing. When none are available, select the artist and choose **Open Top Ten on Beatport** in Actions. A magnifying glass and **Find mix** identify rows that run another search.

**Track Matches** shows up to ten track links in web search order. Press Return to open a track. Choose **Copy Track URL** to copy its link. A track-title search goes straight to these matches. Rows with the same title and artist show a release date when it distinguishes them, or their Beatport track ID.

The prototype sends search text to [Exa’s free, rate-limited web search service](https://exa.ai/mcp) after you pause typing. It requires no account or API key. Results depend on Exa’s index and may omit recent releases.

## Run locally on macOS

With Raycast and Node.js installed, run these commands from the `beatport` directory.

```sh
npm ci
npm run dev
```

For validation, run `npm run typecheck`, `npm test`, and `npm run lint`. Run `npm run build -- --environment dist --output dist` to build a distribution bundle locally.

This independent prototype uses public track links. Beatport has not endorsed it.
