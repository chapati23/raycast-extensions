# Search limits and recovery

## Sub-features

A rate-limited query offers a retry. A successful response with zero hits displays the empty state.

## How to get to it (user POV)

When Search Beatport shows **Search limit reached**, open Actions and select **Retry Search**.

## Driving it with verify

Run `"$V" retry`. The first request for `rate limit` returns a provider error. Inspect `limited.png` for the limit message and the browser-search hint. The driver sends Command-K to Raycast, activates **Retry Search**, and requires **No results found** in `retried.png`. That transition proves a second request ran without changing the query.

## Gotchas

Each invocation starts with fresh fixture state. A second live request could remain rate-limited. This replay covers retry and the empty state. It leaves the external browser closed. If changing the browser action, check its encoded destination separately before claiming coverage.
