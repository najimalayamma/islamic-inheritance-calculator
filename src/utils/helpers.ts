import type { HistoryEntry } from "../engine/models";

/* ─────────────────────────── Formatting ─────────────────────────── */

const CURRENCY_LOCALES: Record<string, string> = {
  INR: "en-IN",
  USD: "en-US",
  AED: "en-AE",
  MYR: "ms-MY",
  EUR: "de-DE",
  GBP: "en-GB",
};

export function formatMoney(value: number, currency: string): string {
  const locale = CURRENCY_LOCALES[currency] ?? "en-IN";
  try {
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency,
      maximumFractionDigits: 2,
      minimumFractionDigits: 0,
    }).format(value);
  } catch {
    return `${currency} ${value.toFixed(2)}`;
  }
}

export function formatPercent(value: number): string {
  return `${value.toLocaleString("en-US", { maximumFractionDigits: 2 })}%`;
}

export function formatDate(iso: string, lang: string): string {
  try {
    return new Date(iso).toLocaleString(lang === "ar" ? "ar" : lang === "ml" ? "ml-IN" : "en-GB", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  } catch {
    return iso;
  }
}

/* ─────────────────────────── Local history ─────────────────────────── */

const HISTORY_KEY = "faraid.history.v1";

export function loadHistory(): HistoryEntry[] {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed as HistoryEntry[];
  } catch {
    return [];
  }
}

export function saveHistoryEntry(entry: HistoryEntry): HistoryEntry[] {
  const list = [entry, ...loadHistory()].slice(0, 30);
  persist(list);
  return list;
}

export function deleteHistoryEntry(id: string): HistoryEntry[] {
  const list = loadHistory().filter((e) => e.id !== id);
  persist(list);
  return list;
}

export function clearHistory(): void {
  persist([]);
}

function persist(list: HistoryEntry[]) {
  try {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(list));
  } catch {
    /* storage unavailable — history is a convenience, not a requirement */
  }
}

export function generateId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}
