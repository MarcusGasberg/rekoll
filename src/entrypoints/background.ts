import { addEvent, getRecentEvents } from '@/storage/event-store';
import { hybridSearch } from '@/storage/search';
import { parseQuery } from '@/storage/query-parser';
import { embedEvent, processBacklog, embedSessionNarrative, processSessionBacklog } from '@/background/event-processor';
import { sendToOffscreen } from '@/background/offscreen-manager';
import { initSessionManager, assignSession, setSessionCallbacks, getAlarmName, handleSessionAlarm, getCurrentSessionId } from '@/background/session-manager';
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
  // Open side panel on extension icon click (Chrome MV3 only; Firefox uses sidebar_action)
  if (browser.sidePanel) {
    browser.sidePanel
      .setPanelBehavior({ openPanelOnActionClick: true })
      .catch(console.error);
  }

  // Wire session callbacks for embedding
  setSessionCallbacks({
    onFinalize: async (session) => { await embedSessionNarrative(session); },
    onReEmbed: async (session) => { await embedSessionNarrative(session); },
  });

  // Initialize session manager before backlog processing
  initSessionManager().catch(console.error);

  // Listen for navigation completion → tell content script to capture
  browser.webNavigation.onCompleted.addListener((details) => {
    if (details.frameId !== 0) return;
    if (
      details.url.startsWith('chrome://') ||
      details.url.startsWith('chrome-extension://') ||
      details.url.startsWith('moz-extension://')
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

  // Listen for session re-embedding alarm
  browser.alarms.onAlarm.addListener((alarm) => {
    if (alarm.name === getAlarmName()) {
      handleSessionAlarm().catch(console.error);
    }
  });

  // Process any unembedded events and sessions from previous sessions
  setTimeout(() => {
    processBacklog().catch(console.error);
    processSessionBacklog().catch(console.error);
  }, 5000);
});

async function handlePageCaptured(message: PageCapturedMessage) {
  try {
    const id = await addEvent(message.data, getCurrentSessionId());
    console.log('[bg] Stored event:', id, message.data.title);

    // Assign to session
    assignSession(id, message.data.timestamp);

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
  // Parse natural language filters from the query
  const parsed = parseQuery(message.query, message.filters);

  // Embed the cleaned query text
  const response = await sendToOffscreen<EmbedTextResponse | EmbedTextError>({
    type: 'EMBED_TEXT',
    id: -1,
    text: parsed.text || message.query, // fall back to original if parser stripped everything
  });

  if (response.type === 'EMBED_TEXT_ERROR') {
    console.error('[bg] Query embedding failed:', response.error);
    return { type: 'SEARCH_RESULT', results: [] };
  }

  const queryVector = new Float32Array(response.vector);
  const results = await hybridSearch(
    queryVector,
    parsed.text || message.query,
    message.limit ?? 10,
    parsed.filters,
  );

  return { type: 'SEARCH_RESULT', results };
}
