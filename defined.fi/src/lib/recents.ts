// Recently-opened tokens, persisted to LocalStorage so they survive between
// command launches. Shown in the search list when the search text is empty.

import { LocalStorage } from "@raycast/api";
import type { TokenResult } from "./types";

const STORAGE_KEY = "recents";
const MAX_RECENTS = 10;

/**
 * Returns the stored recent tokens, most recently opened first.
 * Malformed or missing storage is treated as an empty list.
 */
export async function getRecents(): Promise<TokenResult[]> {
  const raw = await LocalStorage.getItem<string>(STORAGE_KEY);
  if (!raw) return [];

  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isTokenResult);
  } catch {
    return [];
  }
}

/**
 * Records a token as the most recently opened one. Moves it to the front if it
 * was already present (deduped by id), and caps the list at MAX_RECENTS.
 */
export async function addRecent(token: TokenResult): Promise<void> {
  const current = await getRecents();
  const next = [token, ...current.filter((t) => t.id !== token.id)].slice(0, MAX_RECENTS);
  await LocalStorage.setItem(STORAGE_KEY, JSON.stringify(next));
}

/** Clears all stored recent tokens. */
export async function clearRecents(): Promise<void> {
  await LocalStorage.removeItem(STORAGE_KEY);
}

function isTokenResult(value: unknown): value is TokenResult {
  if (typeof value !== "object" || value === null) return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.id === "string" &&
    typeof v.address === "string" &&
    typeof v.networkId === "number" &&
    typeof v.networkName === "string" &&
    typeof v.networkSlug === "string" &&
    typeof v.name === "string" &&
    typeof v.symbol === "string" &&
    typeof v.definedUrl === "string"
  );
}
