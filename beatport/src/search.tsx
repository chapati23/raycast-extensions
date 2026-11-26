import { Action, ActionPanel, Icon, List, type LaunchProps } from "@raycast/api";
import { useEffect, useState } from "react";
import { searchBeatport, type Results, type Track } from "./tracks";

interface SearchResult extends Results {
  query: string;
  error?: string;
}

export default function Command({ fallbackText }: LaunchProps) {
  return <SearchView initialText={fallbackText ?? ""} />;
}

function SearchView({ initialText }: { initialText: string }) {
  const [text, setText] = useState(initialText);
  const [attempt, setAttempt] = useState(0);
  const [result, setResult] = useState<SearchResult>();
  const query = text.trim();
  const canSearch = query.length >= 2;
  const current = canSearch && result?.query === query ? result : undefined;

  useEffect(() => {
    setResult(undefined);
    if (!canSearch) return;
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      try {
        const matches = await searchBeatport(query, controller.signal);
        if (!controller.signal.aborted) setResult({ query, ...matches });
      } catch (error) {
        if (!controller.signal.aborted) {
          const message =
            error instanceof Error && /429|rate.limit/i.test(error.message)
              ? "Exa reached its free search limit. Try again later."
              : "Couldn’t complete the search with Exa. Try again.";
          setResult({ query, tracks: [], chart: [], error: message });
        }
      }
    }, 450);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [canSearch, query, attempt]);

  const chartUrl = current?.profile && current.profile.url + "#:~:text=Top%20Ten%20Tracks&text=Top%2010%20Tracks";
  const loading = canSearch && !current;
  return (
    <List
      filtering={false}
      searchText={text}
      onSearchTextChange={setText}
      searchBarPlaceholder="Artist or track name"
      isLoading={loading}
    >
      {current && (current.profile || current.tracks.length) ? (
        <>
          {current.profile && chartUrl && (
            <>
              <List.Section title="Artist">
                <List.Item
                  title={current.profile.title}
                  subtitle="Artist profile"
                  icon={Icon.Person}
                  actions={
                    <ActionPanel>
                      <Action.OpenInBrowser title="Open Artist on Beatport" url={current.profile.url} />
                      {current.chart.length === 0 && (
                        <Action.OpenInBrowser title="Open Top Ten on Beatport" url={chartUrl} />
                      )}
                      <Action.CopyToClipboard title="Copy Artist URL" content={current.profile.url} />
                    </ActionPanel>
                  }
                />
              </List.Section>
              {current.chart.length > 0 && (
                <List.Section title="Beatport Top Ten" subtitle={current.chart.length + " of 10 available"}>
                  {current.chart.map((entry) => (
                    <List.Item
                      key={entry.rank}
                      title={entry.title}
                      subtitle={entry.credits}
                      accessories={[{ text: (entry.trackUrl ? "" : "Find mix · ") + "#" + entry.rank }]}
                      icon={entry.trackUrl ? Icon.Music : Icon.MagnifyingGlass}
                      actions={
                        <ActionPanel>
                          {entry.trackUrl ? (
                            <Action.OpenInBrowser title="Open on Beatport" url={entry.trackUrl} />
                          ) : (
                            <Action.Push
                              title="Find This Mix"
                              icon={Icon.MagnifyingGlass}
                              target={<SearchView initialText={entry.credits + " " + entry.title} />}
                            />
                          )}
                          <Action.OpenInBrowser title="Open Chart on Beatport" url={chartUrl} />
                        </ActionPanel>
                      }
                    />
                  ))}
                  {current.chart.length < 10 && (
                    <List.Item
                      title="View Full Top Ten on Beatport"
                      icon={Icon.ArrowNe}
                      actions={
                        <ActionPanel>
                          <Action.OpenInBrowser url={chartUrl} />
                        </ActionPanel>
                      }
                    />
                  )}
                </List.Section>
              )}
            </>
          )}
          {current.tracks.length > 0 && (
            <List.Section title="Track Matches">
              {current.tracks.map((track) => (
                <TrackRow key={track.id} track={track} />
              ))}
            </List.Section>
          )}
        </>
      ) : (
        <List.EmptyView
          icon={current?.error ? Icon.ExclamationMark : Icon.MagnifyingGlass}
          title={
            current?.error
              ? "Search failed"
              : loading
                ? "Searching Beatport…"
                : canSearch
                  ? "No results found"
                  : "Search Beatport"
          }
          description={
            current?.error ??
            (loading
              ? undefined
              : canSearch
                ? "Try a track title with the artist’s name."
                : "Enter at least two characters to search with Exa.")
          }
          actions={
            current?.error ? (
              <ActionPanel>
                <Action title="Retry Search" onAction={() => setAttempt(attempt + 1)} />
              </ActionPanel>
            ) : undefined
          }
        />
      )}
    </List>
  );
}

function TrackRow({ track }: { track: Track }) {
  return (
    <List.Item
      title={track.title}
      subtitle={track.artist}
      accessories={track.releaseDetail ? [{ text: track.releaseDetail }] : undefined}
      icon={Icon.Music}
      actions={
        <ActionPanel>
          <Action.OpenInBrowser title="Open on Beatport" url={track.url} />
          <Action.CopyToClipboard title="Copy Track URL" content={track.url} />
        </ActionPanel>
      }
    />
  );
}
