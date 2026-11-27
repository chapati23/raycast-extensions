# Beatport Search for Raycast

Open **Search Beatport** and type an artist or track name. An exact artist-name match puts the profile first. When multiple Beatport profiles share the name, choose from **Artists** to see that profile’s chart. Each choice shows the artist ID and a ranked track when available. In a same-name artist’s chart, **Find This Mix** searches for a track because its indexed credits do not distinguish the artist IDs. **Beatport Top Ten** shows only the numbered positions visible on the indexed artist page. Return opens a track when its title, mix and credits identify a single Beatport track ID among the results. A magnifier and **Find mix** mark entries that need another search. Escape returns to the artist. When fewer than ten ranks are shown, choose **View Full Top Ten on Beatport**, including when no ranks are available.

For a specific version, include the artist, title and mix, for example “Art Department Walls (DJ Tennis Remix).” The artist can also follow the title and version, or sit between the title and the named remix. **Matching Mixes** contains matching indexed credits and titles. **Possible Matches** show names taken from track links when the artist is unconfirmed. **Related Tracks** can include other versions or artists. **Search on Beatport** carries the query to the store when the mix is missing or the provider fails.

The command shows up to ten track results. Rows with identical titles and credits show a distinguishing release date or label, or the Beatport track ID. Use **Copy Track URL** in Actions on a track or a resolved chart rank.

The extension sends query text to [Exa’s free web search service](https://exa.ai/mcp) after you pause typing. It needs no account or key. It can make a focused search for a missing mix or artist profile, and look up the first three unresolved chart entries. Initial results appear while these lookups run. The selected row keeps its Return action until you move to another row. If its chart track resolves, Actions lets you open or copy the verified link. If another artist with the same name appears, choose **View Artist Top Ten** in Actions. During loading or a search limit, press Return from the empty search screen to continue on Beatport. Chart coverage and release availability depend on the index.

## Run locally on macOS

With Raycast and Node.js installed, run these commands from the `beatport` directory.

```sh
npm ci
npm run dev
```

Run `npm run typecheck`, `npm test`, and `npm run lint` for validation. Run `npm run build -- --environment dist --output dist` for a distribution bundle.

This independent prototype uses public track links. Beatport has not endorsed it.
