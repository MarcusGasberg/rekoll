import { embedText, getStatus, initPipeline } from '@/background/embedding-pipeline';
import type {
  EmbedTextRequest,
  ModelStatusRequest,
} from '@/shared/messages';

// Start loading the model immediately
initPipeline().catch(console.error);

// Handle messages from background service worker
browser.runtime.onMessage.addListener(
  (message: (EmbedTextRequest | ModelStatusRequest) & { target?: string; requestId?: string }) => {
    // Only handle messages explicitly targeted at the offscreen document
    if (message.target !== 'offscreen') return;

    if (message.type === 'EMBED_TEXT') {
      handleEmbedText(message).then((response) => {
        browser.runtime.sendMessage({ ...response, requestId: message.requestId });
      });
    }

    if (message.type === 'MODEL_STATUS') {
      const status = getStatus();
      browser.runtime.sendMessage({
        type: 'MODEL_STATUS_RESULT',
        ...status,
        requestId: message.requestId,
      });
    }
  },
);

async function handleEmbedText(message: EmbedTextRequest) {
  try {
    const vector = await embedText(message.text);
    return {
      type: 'EMBED_TEXT_RESULT' as const,
      id: message.id,
      vector: Array.from(vector),
    };
  } catch (err) {
    return {
      type: 'EMBED_TEXT_ERROR' as const,
      id: message.id,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}
