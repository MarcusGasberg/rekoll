export type EventType =
  | 'page_visit'
  | 'purchase'
  | 'video_watch'
  | 'like'
  | 'form_submit';

export interface BrowsingEvent {
  id?: number;
  url: string;
  domain: string;
  timestamp: number;
  eventType: EventType;
  title: string;
  textContent: string;
  metadata?: Record<string, unknown>;
  embeddingId?: number;
}

export interface EmbeddingRecord {
  id?: number;
  eventId: number;
  vector: Float32Array;
  modelVersion: string;
}

// Message types for chrome.runtime messaging
export type MessageType =
  | 'PAGE_CAPTURED'
  | 'GET_EVENTS'
  | 'EVENTS_RESULT'
  | 'CAPTURE_PAGE';

export interface CapturePageMessage {
  type: 'CAPTURE_PAGE';
}

export interface PageCapturedMessage {
  type: 'PAGE_CAPTURED';
  data: Omit<BrowsingEvent, 'id' | 'embeddingId'>;
}

export interface GetEventsMessage {
  type: 'GET_EVENTS';
  limit?: number;
  offset?: number;
}

export interface EventsResultMessage {
  type: 'EVENTS_RESULT';
  events: BrowsingEvent[];
}

export type ExtensionMessage =
  | CapturePageMessage
  | PageCapturedMessage
  | GetEventsMessage
  | EventsResultMessage;
