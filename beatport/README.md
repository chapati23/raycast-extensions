# Beatport Search for Raycast

Open **Search Beatport** and type an artist or track name. An exact artist-name match puts the profile first. **Beatport Top Ten** shows only the numbered positions visible on the indexed artist page. Return opens a track when its title, mix and credits identify a single Beatport track ID among the results. A magnifier and **Find mix** mark entries that need another search. Escape returns to the artist. If the index has no ranks, select the artist and open **Top Ten** in Actions.

For a specific version, include the artist, title and mix, for example “Art Department Walls (DJ Tennis Remix).” **Matching Mixes** contains matching indexed credits and titles. A **Possible Match** gets its title from the URL when the page metadata is missing. **Related Tracks** can include other versions or artists. **Search on Beatport** carries the query to the store when the mix is missing or the provider fails.

The command shows up to ten track results. Rows with identical titles and credits show a distinguishing release date or label, or the Beatport track ID. Use **Copy Track URL** in Actions to copy the link.

The extension sends query text to [Exa’s free web search service](https://exa.ai/mcp) after you pause typing. It needs no account or key. It can make a focused search for a missing mix or artist profile, and look up the first three unresolved chart entries. The free service has rate limits. Chart coverage and release availability depend on the index.

## Run locally on macOS

With Raycast and Node.js installed, run these commands from the `beatport` directory.

```sh
npm ci
npm run dev
```

Run `npm run typecheck`, `npm test`, and `npm run lint` for validation. Run `npm run build -- --environment dist --output dist` for a distribution bundle.

This independent prototype uses public track links. Beatport has not endorsed it.
