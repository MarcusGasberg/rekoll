import { addEvent, getRecentEvents } from '@/storage/event-store';
import type {
  ExtensionMessage,
  PageCapturedMessage,
  GetEventsMessage,
} from '@/shared/types';

export default defineBackground(() => {
  // Open side panel on extension icon click
  browser.sidePanel
    .setPanelBehavior({ openPanelOnActionClick: true })
    .catch(console.error);

  // Listen for navigation completion → tell content script to capture
  browser.webNavigation.onCompleted.addListener((details) => {
    // Only main frame, skip chrome:// and extension pages
    if (details.frameId !== 0) return;
    if (
      details.url.startsWith('chrome://') ||
      details.url.startsWith('chrome-extension://')
    )
      return;

    browser.tabs
      .sendMessage(details.tabId, { type: 'CAPTURE_PAGE' } as ExtensionMessage)
      .catch(() => {
        // Content script may not be injected yet on some pages
      });
  });

  // Handle messages from content scripts and side panel
  browser.runtime.onMessage.addListener(
    (message: ExtensionMessage, _sender, sendResponse) => {
      if (message.type === 'PAGE_CAPTURED') {
        handlePageCaptured(message);
        return false;
      }

      if (message.type === 'GET_EVENTS') {
        handleGetEvents(message).then(sendResponse);
        return true; // async response
      }

      return false;
    },
  );
});

async function handlePageCaptured(message: PageCapturedMessage) {
  try {
    const id = await addEvent(message.data);
    console.log('[bg] Stored event:', id, message.data.title);
  } catch (err) {
    console.error('[bg] Failed to store event:', err);
  }
}

async function handleGetEvents(message: GetEventsMessage) {
  const events = await getRecentEvents(message.limit, message.offset);
  return { type: 'EVENTS_RESULT' as const, events };
}
