import {
  pipeline,
  env,
  type FeatureExtractionPipeline,
} from '@huggingface/transformers';

// Configure Transformers.js for extension environment
env.allowLocalModels = false;
env.useBrowserCache = true;
// Point ONNX Runtime to bundled WASM files instead of CDN (blocked by MV3 CSP)
env.backends.onnx.wasm!.wasmPaths = chrome.runtime.getURL('/wasm/');

const MODEL_ID = 'Xenova/all-MiniLM-L6-v2';

let embeddingPipeline: FeatureExtractionPipeline | null = null;
let loadError: string | null = null;
let initPromise: Promise<void> | null = null;

export function initPipeline(): Promise<void> {
  if (initPromise) return initPromise;

  initPromise = (async () => {
    try {
      // @ts-expect-error - pipeline() overload union is too complex for TS
      embeddingPipeline = await pipeline('feature-extraction', MODEL_ID, {
        dtype: 'q8',
      });
      console.log('[offscreen] Model loaded:', MODEL_ID);
    } catch (err) {
      loadError = err instanceof Error ? err.message : String(err);
      console.error('[offscreen] Failed to load model:', err);
      initPromise = null; // allow retry
      throw err;
    }
  })();

  return initPromise;
}

export async function embedText(text: string): Promise<Float32Array> {
  await initPipeline();

  const output = await embeddingPipeline!(text, {
    pooling: 'mean',
    normalize: true,
  });

  return new Float32Array(output.data as Float32Array);
}

export function getStatus(): {
  ready: boolean;
  loading: boolean;
  error?: string;
} {
  return {
    ready: embeddingPipeline !== null,
    loading: initPromise !== null && embeddingPipeline === null,
    ...(loadError ? { error: loadError } : {}),
  };
}
