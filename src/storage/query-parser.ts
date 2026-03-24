import type { SearchFilters } from './search';
import type { EventType } from '@/shared/types';

export interface ParsedQuery {
  /** The cleaned query text (filter phrases removed) */
  text: string;
  /** Extracted filters to merge with any explicit filters */
  filters: SearchFilters;
}

// ── Domain extraction ──

const DOMAIN_PATTERNS = [
  // "on youtube.com", "from amazon.com", "at reddit.com"
  /\b(?:on|from|at)\s+([\w.-]+\.(?:com|org|net|io|co|dev|tv|me|app))\b/i,
  // "site:example.com"
  /\bsite:([\w.-]+\.[\w]+)\b/i,
  // Known shorthand: "on youtube", "from amazon", "on reddit", "on twitter"
  /\b(?:on|from)\s+(youtube|amazon|reddit|twitter|github|google|stackoverflow)\b/i,
];

const DOMAIN_EXPANSIONS: Record<string, string> = {
  youtube: 'www.youtube.com',
  amazon: 'www.amazon.com',
  reddit: 'www.reddit.com',
  twitter: 'x.com',
  github: 'github.com',
  google: 'www.google.com',
  stackoverflow: 'stackoverflow.com',
};

// ── Event type extraction ──

const TYPE_PATTERNS: { pattern: RegExp; type: EventType }[] = [
  { pattern: /\b(?:videos?\s+(?:i\s+)?watched|watched\s+videos?)\b/i, type: 'video_watch' },
  { pattern: /\b(?:things?\s+(?:i\s+)?(?:bought|purchased)|purchases?|orders?)\b/i, type: 'purchase' },
  { pattern: /\b(?:things?\s+(?:i\s+)?liked|(?:my\s+)?likes)\b/i, type: 'like' },
  { pattern: /\b(?:pages?\s+(?:i\s+)?visited|(?:my\s+)?visits?)\b/i, type: 'page_visit' },
];

// ── Date extraction ──

function startOfDay(d: Date): number {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
}

function endOfDay(d: Date): number {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999).getTime();
}

interface DateRange {
  startDate: number;
  endDate: number;
}

const DATE_EXTRACTORS: { pattern: RegExp; resolve: () => DateRange }[] = [
  {
    pattern: /\byesterday\b/i,
    resolve: () => {
      const d = new Date();
      d.setDate(d.getDate() - 1);
      return { startDate: startOfDay(d), endDate: endOfDay(d) };
    },
  },
  {
    pattern: /\btoday\b/i,
    resolve: () => {
      const d = new Date();
      return { startDate: startOfDay(d), endDate: endOfDay(d) };
    },
  },
  {
    pattern: /\blast\s+week\b/i,
    resolve: () => {
      const end = new Date();
      const start = new Date();
      start.setDate(start.getDate() - 7);
      return { startDate: startOfDay(start), endDate: endOfDay(end) };
    },
  },
  {
    pattern: /\bthis\s+week\b/i,
    resolve: () => {
      const now = new Date();
      const dayOfWeek = now.getDay();
      const start = new Date(now);
      start.setDate(start.getDate() - dayOfWeek);
      return { startDate: startOfDay(start), endDate: endOfDay(now) };
    },
  },
  {
    pattern: /\blast\s+month\b/i,
    resolve: () => {
      const end = new Date();
      const start = new Date();
      start.setDate(start.getDate() - 30);
      return { startDate: startOfDay(start), endDate: endOfDay(end) };
    },
  },
  {
    pattern: /\bthis\s+month\b/i,
    resolve: () => {
      const now = new Date();
      const start = new Date(now.getFullYear(), now.getMonth(), 1);
      return { startDate: startOfDay(start), endDate: endOfDay(now) };
    },
  },
];

// ── Main parser ──

export function parseQuery(query: string, existingFilters?: SearchFilters): ParsedQuery {
  let text = query;
  const filters: SearchFilters = { ...existingFilters };

  // Extract domain (only if no explicit domain filter)
  if (!filters.domain) {
    for (const pattern of DOMAIN_PATTERNS) {
      const match = text.match(pattern);
      if (match) {
        const raw = match[1].toLowerCase();
        filters.domain = DOMAIN_EXPANSIONS[raw] ?? raw;
        text = text.replace(match[0], '').trim();
        break;
      }
    }
  }

  // Extract event type (only if no explicit filter)
  if (!filters.eventType) {
    for (const { pattern, type } of TYPE_PATTERNS) {
      const match = text.match(pattern);
      if (match) {
        filters.eventType = type;
        text = text.replace(match[0], '').trim();
        break;
      }
    }
  }

  // Extract date range (only if no explicit date filters)
  if (!filters.startDate && !filters.endDate) {
    for (const { pattern, resolve } of DATE_EXTRACTORS) {
      const match = text.match(pattern);
      if (match) {
        const range = resolve();
        filters.startDate = range.startDate;
        filters.endDate = range.endDate;
        text = text.replace(match[0], '').trim();
        break;
      }
    }
  }

  // Clean up extra whitespace
  text = text.replace(/\s+/g, ' ').trim();

  return { text, filters };
}
