// Search Defined.fi command: search tokens by name/symbol/address across Codex,
// preview them in a detail pane, and open the highlighted result on defined.fi.

import { useCallback, useEffect, useRef, useState } from "react";
import {
  Action,
  ActionPanel,
  Color,
  Icon,
  Keyboard,
  List,
  openExtensionPreferences,
  showToast,
  Toast,
} from "@raycast/api";
import { useCachedPromise } from "@raycast/utils";
import { getNetworks, searchTokens } from "./lib/codex";
import { getApiKey } from "./lib/key";
import { Onboarding } from "./components/Onboarding";
import { CodexError } from "./lib/types";
import type { Network, TokenResult } from "./lib/types";
import { addRecent, clearRecents, getRecents } from "./lib/recents";
import { formatPercent, formatUsd } from "./lib/format";

const SEARCH_DEBOUNCE_MS = 300;

type EmptyState = "none" | "no-results" | "quota" | "error";

/** Identifies the query a result set belongs to, so stale results are never shown. */
function queryKey(phrase: string, networkId: string): string {
  return `${networkId}|${phrase}`;
}

export default function Command() {
  const [apiKey, setApiKey] = useState<string | undefined>(undefined);
  const [isLoadingKey, setIsLoadingKey] = useState(true);

  useEffect(() => {
    let cancelled = false;
    getApiKey().then((key) => {
      if (cancelled) return;
      setApiKey(key);
      setIsLoadingKey(false);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  if (isLoadingKey) {
    return <List isLoading />;
  }

  if (!apiKey) {
    return <Onboarding reason="missing" onDone={setApiKey} />;
  }

  return <SearchView apiKey={apiKey} onApiKeyChange={setApiKey} />;
}

function SearchView({ apiKey, onApiKeyChange }: { apiKey: string; onApiKeyChange: (apiKey: string) => void }) {
  const [searchText, setSearchText] = useState("");
  const [debouncedText, setDebouncedText] = useState("");
  const [networkId, setNetworkId] = useState<string>("all");
  const [results, setResults] = useState<TokenResult[]>([]);
  const [resultsKey, setResultsKey] = useState<string | undefined>(undefined);
  const [isSearching, setIsSearching] = useState(false);
  const [emptyState, setEmptyState] = useState<EmptyState>("none");
  const [invalidKey, setInvalidKey] = useState(false);
  const [recents, setRecents] = useState<TokenResult[]>([]);
  const [recentsLoaded, setRecentsLoaded] = useState(false);

  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { data: networks, isLoading: networksLoading } = useCachedPromise((key: string) => getNetworks(key), [apiKey], {
    initialData: [] as Network[],
    onError: (error) => {
      if (error instanceof CodexError && error.kind === "invalid-key") {
        setInvalidKey(true);
        return;
      }
      void showToast({ style: Toast.Style.Failure, title: "Failed to load networks", message: error.message });
    },
  });

  // Debounce the raw search text; only commit it after typing pauses.
  useEffect(() => {
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => {
      setDebouncedText(searchText);
    }, SEARCH_DEBOUNCE_MS);
    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
    };
  }, [searchText]);

  // Load recents whenever the search box is empty.
  useEffect(() => {
    if (debouncedText.trim() !== "") return;
    let cancelled = false;
    getRecents().then((stored) => {
      if (cancelled) return;
      setRecents(stored);
      setRecentsLoaded(true);
    });
    return () => {
      cancelled = true;
    };
  }, [debouncedText]);

  // Run the search once the debounced text (or the selected network) changes.
  // Cancels the in-flight request when either changes again, or on unmount.
  useEffect(() => {
    const phrase = debouncedText.trim();
    if (phrase === "") return;
    const key = queryKey(phrase, networkId);

    const controller = new AbortController();
    setIsSearching(true);

    searchTokens(apiKey, phrase, {
      networkId: networkId === "all" ? undefined : Number(networkId),
      signal: controller.signal,
    })
      .then((tokens) => {
        if (controller.signal.aborted) return;
        setResults(tokens);
        setResultsKey(key);
        setEmptyState(tokens.length === 0 ? "no-results" : "none");
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted || isAbortError(error)) return;
        setResults([]);
        setResultsKey(key);
        setEmptyState("error");

        if (!(error instanceof CodexError)) {
          void showToast({
            style: Toast.Style.Failure,
            title: "Search failed",
            message: error instanceof Error ? error.message : String(error),
          });
          return;
        }

        switch (error.kind) {
          case "invalid-key":
            setInvalidKey(true);
            break;
          case "quota":
            setEmptyState("quota");
            break;
          case "rate-limit":
            void showToast({ style: Toast.Style.Failure, title: "Too many requests, try again in a moment" });
            break;
          case "network":
          case "unknown":
          default:
            void showToast({ style: Toast.Style.Failure, title: "Search failed", message: error.message });
            break;
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setIsSearching(false);
      });

    return () => controller.abort();
  }, [apiKey, debouncedText, networkId]);

  const handleOpen = useCallback((token: TokenResult) => {
    void addRecent(token).then(() => getRecents().then(setRecents));
  }, []);

  const handleClearRecents = useCallback(() => {
    void clearRecents().then(() => {
      setRecents([]);
      void showToast({ style: Toast.Style.Success, title: "Cleared recents" });
    });
  }, []);

  if (invalidKey) {
    return (
      <Onboarding
        reason="rejected"
        onDone={(key) => {
          setInvalidKey(false);
          onApiKeyChange(key);
        }}
      />
    );
  }

  // Use the live search text, not the debounced one: Enter must never open a
  // recent or a previous query's result while the current query is pending.
  const phrase = searchText.trim();
  const isEmptySearch = phrase === "";
  const isCurrent = resultsKey === queryKey(phrase, networkId);
  const items = isEmptySearch ? recents : isCurrent ? results : [];
  const isLoading = networksLoading || isSearching || (isEmptySearch ? !recentsLoaded : !isCurrent);

  return (
    <List
      isLoading={isLoading}
      filtering={false}
      throttle={false}
      searchText={searchText}
      onSearchTextChange={setSearchText}
      isShowingDetail={items.length > 0}
      searchBarPlaceholder="Token name, symbol, or address"
      navigationTitle="Defined.fi"
      searchBarAccessory={<NetworkDropdown networks={networks ?? []} onChange={setNetworkId} />}
    >
      {isEmptySearch ? (
        recents.length === 0 ? (
          <List.EmptyView
            icon={Icon.MagnifyingGlass}
            title="Search Defined.fi"
            description="Type a token name, symbol, or contract address"
          />
        ) : (
          <List.Section title="Recent">
            {recents.map((token) => (
              <TokenListItem
                key={token.id}
                token={token}
                onOpen={handleOpen}
                showClearRecents
                onClearRecents={handleClearRecents}
              />
            ))}
          </List.Section>
        )
      ) : !isCurrent ? (
        <List.EmptyView icon={Icon.MagnifyingGlass} title="Searching…" />
      ) : emptyState === "quota" ? (
        <List.EmptyView
          icon={Icon.ExclamationMark}
          title="Monthly Codex limit reached"
          description="The free Codex plan includes 10,000 requests per month. Upgrade your plan or wait for the next monthly cycle."
          actions={
            <ActionPanel>
              <Action.OpenInBrowser title="Open Codex Dashboard" url="https://dashboard.codex.io/dashboard" />
            </ActionPanel>
          }
        />
      ) : emptyState === "no-results" ? (
        <List.EmptyView
          icon={Icon.XMarkCircle}
          title="No tokens found"
          description='Try the contract address, or "$SYMBOL" for an exact symbol match.'
        />
      ) : emptyState === "error" ? (
        <List.EmptyView icon={Icon.Warning} title="Search failed" description="Edit the search to try again." />
      ) : (
        results.map((token) => <TokenListItem key={token.id} token={token} onOpen={handleOpen} />)
      )}
    </List>
  );
}

function NetworkDropdown({ networks, onChange }: { networks: Network[]; onChange: (value: string) => void }) {
  return (
    <List.Dropdown tooltip="Network" storeValue defaultValue="all" onChange={onChange}>
      <List.Dropdown.Item title="All Networks" value="all" />
      {networks.length > 0 && (
        <List.Dropdown.Section title="Networks">
          {networks.map((network) => (
            <List.Dropdown.Item key={network.id} title={network.name} value={String(network.id)} />
          ))}
        </List.Dropdown.Section>
      )}
    </List.Dropdown>
  );
}

function TokenListItem({
  token,
  onOpen,
  showClearRecents,
  onClearRecents,
}: {
  token: TokenResult;
  onOpen: (token: TokenResult) => void;
  showClearRecents?: boolean;
  onClearRecents?: () => void;
}) {
  const color = changeColor(token.change24);
  const changeText = formatPercent(token.change24);

  return (
    <List.Item
      id={token.id}
      title={token.symbol}
      subtitle={token.name}
      icon={token.imageUrl ? { source: token.imageUrl, fallback: Icon.Coins } : Icon.Coins}
      accessories={[
        { tag: token.networkSlug.toUpperCase() },
        { text: formatUsd(token.priceUsd) },
        { text: color ? { value: changeText, color } : changeText },
      ]}
      detail={<TokenDetail token={token} />}
      actions={
        <ActionPanel>
          <ActionPanel.Section>
            <Action.OpenInBrowser title="Open on Defined.fi" url={token.definedUrl} onOpen={() => onOpen(token)} />
            <Action.CopyToClipboard
              title="Copy Contract Address"
              content={token.address}
              shortcut={Keyboard.Shortcut.Common.Copy}
            />
            {token.explorerUrl && (
              <Action.OpenInBrowser
                title="Open on Block Explorer"
                url={token.explorerUrl}
                shortcut={{ modifiers: ["cmd", "shift"], key: "e" }}
              />
            )}
          </ActionPanel.Section>
          {showClearRecents && (
            <ActionPanel.Section>
              <Action
                title="Clear Recents"
                icon={Icon.Trash}
                style={Action.Style.Destructive}
                onAction={onClearRecents}
              />
            </ActionPanel.Section>
          )}
          <ActionPanel.Section>
            <Action title="Codex API Key…" icon={Icon.Key} onAction={openExtensionPreferences} />
          </ActionPanel.Section>
        </ActionPanel>
      }
    />
  );
}

function TokenDetail({ token }: { token: TokenResult }) {
  const color = changeColor(token.change24);
  const changeText = formatPercent(token.change24);

  return (
    <List.Item.Detail
      metadata={
        <List.Item.Detail.Metadata>
          <List.Item.Detail.Metadata.Label title="Name" text={`${token.name} (${token.symbol})`} />
          <List.Item.Detail.Metadata.Label title="Network" text={token.networkName} />
          <List.Item.Detail.Metadata.Label title="Price" text={formatUsd(token.priceUsd)} />
          <List.Item.Detail.Metadata.Label
            title="24h Change"
            text={color ? { value: changeText, color } : changeText}
          />
          <List.Item.Detail.Metadata.Label title="Liquidity" text={formatUsd(token.liquidityUsd)} />
          <List.Item.Detail.Metadata.Label title="24h Volume" text={formatUsd(token.volume24Usd)} />
          <List.Item.Detail.Metadata.Label title="Market Cap" text={formatUsd(token.marketCapUsd)} />
          <List.Item.Detail.Metadata.Separator />
          <List.Item.Detail.Metadata.Label title="Contract Address" text={token.address} />
        </List.Item.Detail.Metadata>
      }
    />
  );
}

function changeColor(change?: number): Color | undefined {
  if (change === undefined || Number.isNaN(change)) return undefined;
  return change >= 0 ? Color.Green : Color.Red;
}

function isAbortError(error: unknown): boolean {
  return error instanceof Error && error.name === "AbortError";
}
