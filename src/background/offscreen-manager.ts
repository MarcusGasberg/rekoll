import { browser } from "wxt/browser";

const OFFSCREEN_PATH = "offscreen.html";
const hasOffscreen = typeof chrome !== "undefined" && !!chrome.offscreen;

// ── Offscreen document flow (Chrome MV3) ──

let creating: Promise<void> | null = null;

async function ensureOffscreenDocument(): Promise<void> {
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
    justification: "Run ML inference with Transformers.js",
  });

  await creating;
  creating = null;
  console.log("[bg] Offscreen document created");
}

function sendViaOffscreen<T>(message: unknown): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const requestId = Math.random().toString(36).slice(2);
    const tagged = { ...(message as object), target: "offscreen", requestId };

    const listener = (response: any) => {
      if (response?.requestId === requestId) {
        browser.runtime.onMessage.removeListener(listener);
        resolve(response as T);
      }
    };

    browser.runtime.onMessage.addListener(listener);

    browser.runtime.sendMessage(tagged).catch((err) => {
      browser.runtime.onMessage.removeListener(listener);
      reject(err);
    });

    setTimeout(() => {
      browser.runtime.onMessage.removeListener(listener);
      reject(new Error("Offscreen message timeout"));
    }, 120_000);
  });
}

// ── Direct pipeline flow (Firefox MV2 background page) ──

let directPipeline: {
  embedText: (text: string) => Promise<Float32Array>;
  getStatus: () => { ready: boolean; loading: boolean; error?: string };
} | null = null;

async function getDirectPipeline() {
  if (!directPipeline) {
    // Use a variable to prevent bundler from statically resolving the import
    const mod = await import("./embedding-pipeline");
    await mod.initPipeline();
    directPipeline = mod;
  }
  return directPipeline;
}

async function sendDirect<T>(message: unknown): Promise<T> {
  const msg = message as { type: string; id?: number; text?: string };
  const pipe = await getDirectPipeline();

  if (msg.type === "EMBED_TEXT") {
    try {
      const vector = await pipe.embedText(msg.text!);
      return {
        type: "EMBED_TEXT_RESULT",
        id: msg.id,
        vector: Array.from(vector),
      } as T;
    } catch (err) {
      return {
        type: "EMBED_TEXT_ERROR",
        id: msg.id,
        error: err instanceof Error ? err.message : String(err),
      } as T;
    }
  }

  if (msg.type === "MODEL_STATUS") {
    return { type: "MODEL_STATUS_RESULT", ...pipe.getStatus() } as T;
  }

  throw new Error(`Unknown message type: ${msg.type}`);
}

// ── Public API ──

/**
 * Send a message to the embedding pipeline and wait for a response.
 * On Chrome MV3: routes through an offscreen document.
 * On Firefox MV2: calls the pipeline directly in the background page.
 */
export async function sendToOffscreen<T>(message: unknown): Promise<T> {
  if (hasOffscreen) {
    await ensureOffscreenDocument();
    return sendViaOffscreen<T>(message);
  }
  return sendDirect<T>(message);
}
