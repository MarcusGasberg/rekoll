import { addEvent, getRecentEvents } from '@/storage/event-store';
import { semanticSearch } from '@/storage/search';
import { embedEvent, processBacklog } from '@/background/event-processor';
import { sendToOffscreen } from '@/background/offscreen-manager';
import type {
  ExtensionMessage,
  PageCapturedMessage,
  GetEventsMessage,
} from '@/shared/types';
import type {
  SearchRequest,
  SearchResponse,
  EmbedTextResponse,
  EmbedTextError,
  ModelStatusResponse,
  AllMessages,
} from '@/shared/messages';

export default defineBackground(() => {
  // Open side panel on extension icon click
  browser.sidePanel
    .setPanelBehavior({ openPanelOnActionClick: true })
    .catch(console.error);

  // Listen for navigation completion → tell content script to capture
  browser.webNavigation.onCompleted.addListener((details) => {
    if (details.frameId !== 0) return;
    if (
      details.url.startsWith('chrome://') ||
      details.url.startsWith('chrome-extension://')
    )
      return;

    browser.tabs
      .sendMessage(details.tabId, { type: 'CAPTURE_PAGE' } as ExtensionMessage)
      .catch(() => {});
  });

  // Handle messages from content scripts and side panel
  browser.runtime.onMessage.addListener(
    (message: AllMessages & { target?: string; requestId?: string }, _sender, sendResponse) => {
      // Ignore messages targeted at offscreen doc or responses from it
      if (message.target === 'offscreen' || 'requestId' in message) return false;

      if (message.type === 'PAGE_CAPTURED') {
        handlePageCaptured(message as PageCapturedMessage);
        return false;
      }

      if (message.type === 'GET_EVENTS') {
        handleGetEvents(message as GetEventsMessage).then(sendResponse);
        return true;
      }

      if (message.type === 'SEARCH') {
        handleSearch(message as SearchRequest).then(sendResponse);
        return true;
      }

      if (message.type === 'MODEL_STATUS') {
        sendToOffscreen<ModelStatusResponse>(message).then(sendResponse);
        return true;
      }

      return false;
    },
  );

  // Process any unembedded events from previous sessions
  setTimeout(() => processBacklog().catch(console.error), 5000);
});

async function handlePageCaptured(message: PageCapturedMessage) {
  try {
    const id = await addEvent(message.data);
    console.log('[bg] Stored event:', id, message.data.title);

    // Embed asynchronously — don't block the capture
    embedEvent(id).catch((err) =>
      console.error('[bg] Async embedding failed:', err),
    );
  } catch (err) {
    console.error('[bg] Failed to store event:', err);
  }
}

async function handleGetEvents(message: GetEventsMessage) {
  const events = await getRecentEvents(message.limit, message.offset);
  return { type: 'EVENTS_RESULT' as const, events };
}

async function handleSearch(message: SearchRequest): Promise<SearchResponse> {
  // Embed the query
  const response = await sendToOffscreen<EmbedTextResponse | EmbedTextError>({
    type: 'EMBED_TEXT',
    id: -1,
    text: message.query,
  });

  if (response.type === 'EMBED_TEXT_ERROR') {
    console.error('[bg] Query embedding failed:', response.error);
    return { type: 'SEARCH_RESULT', results: [] };
  }

  const queryVector = new Float32Array(response.vector);
  const results = await semanticSearch(
    queryVector,
    message.limit ?? 10,
    message.filters,
  );

  return { type: 'SEARCH_RESULT', results };
}
