---
name: verify-beatport
description: Verify the Beatport Search extension in native macOS Raycast. Use after changes to query matching, artist charts, row actions, artwork, or provider recovery, and to diagnose differences between replayed and live Exa results.
---

# Verify Beatport Search in Raycast

## Launch

Use a logged-in Mac with Raycast running, Python 3, Swift command-line tools and the Node version supported by the extension. The terminal running the verifier needs Accessibility and Screen Recording access. Raycast has one shared UI. Use it when the user and other automation are idle. Parallel verifier runs for the same account share a lock.

From the repository root, install the locked dependencies once:

```sh
(cd beatport && npm ci)
V=.agents/skills/verify-beatport/scripts/verify
"$V" doctor
"$V" mixes
```

Each journey builds a new, randomly named Raycast development command from this checkout using the extension’s installed Raycast CLI. It opens the command with the query, confirms the prompt bearing that command’s unique title, and waits for the expected native UI. A compiled bundle alone does not establish readiness.

## Doctor

Run `"$V" doctor` to check the local Raycast CLI, running application and Accessibility access without opening a command. If a journey fails, look at the last operation in `actions.txt` and at `build.log`. A screenshot failure can require Screen Recording permission even when doctor passes. The doctor checks prerequisites. A successful journey proves the installation can display and drive a result.

## Drive

Choose the [feature](features/README.md) affected by the change. Run each command from the repository root using the `V` assignment above.

| Command | What the native check exercises |
| --- | --- |
| `"$V" mixes` | Exact remix above a related version, row icons and the Copy Track URL action |
| `"$V" chart` | Artist above its partial chart, rank order and Find This Mix opening a second search |
| `"$V" retry` | Rate-limit message, then Retry Search leading to an empty result |
| `"$V" live` | The real Exa connection, a known Walls mix and its track action |

The first three journeys replay responses at the MCP client boundary. Track parsing, asynchronous search, row construction, native menus and navigation come from the checkout. Artwork can still contact Beatport’s CDN. The live journey uses the real client and sends the Walls query to Exa. A changed index or rate limit can fail live even when replay passes.

From `beatport/`, run `npm test` for cases such as same-name artist IDs, ambiguous releases and the selected row’s action during late lookups. Use those tests with the mapped native journey when changing either behavior.

## Evidence

Each command prints its evidence directory. Use a new path to keep a named run, for example `"$V" chart --evidence "$PWD/proof-chart"`. Prefer a directory outside the checkout when keeping proof for a PR. Save the printed path before reporting a result.

Keep `revision.txt` (commit and scoped worktree status), `build.log`, `actions.txt` and the PNGs together. The action log records attempted operations. Its final PASS follows all assertions and normal cleanup. Inspect each PNG at native size, particularly when testing artwork. A visible menu item proves the action is available. The chart and retry journeys activate actions and check their resulting views. The harness leaves the browser and clipboard alone. Report those side effects as untested if the change depends on them.

## Cleanup

The runner stops its development process group, removes its private installation and source copy, and releases the shared UI lock on normal completion or a handled failure. It preserves the evidence directory. On an interrupted run, use the exact `verify-beatport-…` command ID from the OPEN line and the SCRATCH path in the action log to identify leftovers. Confirm ownership before removal. Keep the installed `beatport-search` command. Verify the expected PNGs still open after cleanup.

## Helpers

`scripts/verify` owns setup, assertions and cleanup. It invokes `scripts/native.swift` for Raycast-specific Accessibility actions. The standalone read-only invocation is `.agents/skills/verify-beatport/scripts/native.swift doctor`. The replay data and MCP responses live in `scripts/provider.ts`, imported by the temporary command only.
