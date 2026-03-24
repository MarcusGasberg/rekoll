import type { BrowsingEvent, ExtensionMessage } from './types';

// ── Offscreen ↔ Background messages ──

export interface EmbedTextRequest {
  type: 'EMBED_TEXT';
  id: number;
  text: string;
}

export interface EmbedTextResponse {
  type: 'EMBED_TEXT_RESULT';
  id: number;
  vector: number[]; // serialized Float32Array (can't send typed arrays via messaging)
}

export interface EmbedTextError {
  type: 'EMBED_TEXT_ERROR';
  id: number;
  error: string;
}

export interface ModelStatusRequest {
  type: 'MODEL_STATUS';
}

export interface ModelStatusResponse {
  type: 'MODEL_STATUS_RESULT';
  ready: boolean;
  loading: boolean;
  error?: string;
}

// ── Side panel → Background search messages ──

export interface SearchRequest {
  type: 'SEARCH';
  query: string;
  limit?: number;
  filters?: {
    domain?: string;
    eventType?: string;
    startDate?: number;
    endDate?: number;
  };
}

export interface SearchResult {
  event: BrowsingEvent;
  score: number;
  matchType?: 'semantic' | 'keyword' | 'both';
  sessionId?: number;
  sessionNarrative?: string;
}

export interface SearchResponse {
  type: 'SEARCH_RESULT';
  results: SearchResult[];
}

export type OffscreenMessage =
  | EmbedTextRequest
  | EmbedTextResponse
  | EmbedTextError
  | ModelStatusRequest
  | ModelStatusResponse;

export type AllMessages =
  | ExtensionMessage
  | OffscreenMessage
  | SearchRequest
  | SearchResponse;
