const OFFSCREEN_PATH = 'offscreen.html';

let creating: Promise<void> | null = null;

export async function ensureOffscreenDocument(): Promise<void> {
  const existingContexts = await chrome.runtime.getContexts({
    contextTypes: [chrome.runtime.ContextType.OFFSCREEN_DOCUMENT],
    documentUrls: [chrome.runtime.getURL(OFFSCREEN_PATH)],
  });

  if (existingContexts.length > 0) return;

  if (creating) {
    await creating;
    return;
  }

  creating = chrome.offscreen.createDocument({
    url: OFFSCREEN_PATH,
    reasons: [chrome.offscreen.Reason.WORKERS],
    justification: 'Run ML inference with Transformers.js',
  });

  await creating;
  creating = null;
  console.log('[bg] Offscreen document created');
}

/**
 * Send a message to the offscreen document and wait for a response.
 * Uses a `target: 'offscreen'` field so the offscreen doc's listener
 * can distinguish messages meant for it.
 */
export async function sendToOffscreen<T>(message: unknown): Promise<T> {
  await ensureOffscreenDocument();

  return new Promise<T>((resolve, reject) => {
    // Use a one-time listener for the response keyed by a unique requestId
    const requestId = Math.random().toString(36).slice(2);
    const tagged = { ...(message as object), target: 'offscreen', requestId };

    const listener = (response: any) => {
      if (response?.requestId === requestId) {
        chrome.runtime.onMessage.removeListener(listener);
        resolve(response as T);
      }
    };

    chrome.runtime.onMessage.addListener(listener);

    chrome.runtime.sendMessage(tagged).catch((err) => {
      chrome.runtime.onMessage.removeListener(listener);
      reject(err);
    });

    // Timeout after 120s (model loading can be slow on first run)
    setTimeout(() => {
      chrome.runtime.onMessage.removeListener(listener);
      reject(new Error('Offscreen message timeout'));
    }, 120_000);
  });
}
