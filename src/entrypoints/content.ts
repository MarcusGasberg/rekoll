import { Readability } from '@mozilla/readability';
import type { ExtensionMessage, PageCapturedMessage } from '@/shared/types';

export default defineContentScript({
  matches: ['<all_urls>'],
  runAt: 'document_idle',

  main() {
    // Listen for capture requests from background
    browser.runtime.onMessage.addListener(
      (message: ExtensionMessage, _sender, sendResponse) => {
        if (message.type === 'CAPTURE_PAGE') {
          capturePage().then(sendResponse);
          return true;
        }
        return false;
      },
    );

    // Also capture on initial load
    capturePage();
  },
});

async function capturePage() {
  try {
    const data = extractPageData();
    if (!data) return;

    const message: PageCapturedMessage = {
      type: 'PAGE_CAPTURED',
      data,
    };

    await browser.runtime.sendMessage(message);
  } catch (err) {
    console.error('[content] Failed to capture page:', err);
  }
}

function extractPageData(): PageCapturedMessage['data'] | null {
  const url = window.location.href;
  const domain = window.location.hostname;
  const title = document.title;

  if (!title && !document.body?.textContent?.trim()) return null;

  // Use Readability for main content extraction
  let textContent = '';
  try {
    const clone = document.cloneNode(true) as Document;
    const article = new Readability(clone).parse();
    if (article?.textContent) {
      textContent = article.textContent.trim();
    }
  } catch {
    // Readability can fail on some pages
  }

  // Fallback: meta description + truncated body text
  if (!textContent) {
    const metaDesc =
      document
        .querySelector('meta[name="description"]')
        ?.getAttribute('content') ?? '';
    const bodyText = document.body?.innerText ?? '';
    textContent = [metaDesc, bodyText].filter(Boolean).join('\n');
  }

  // Truncate to ~500 tokens (~2000 chars)
  textContent = textContent.slice(0, 2000);

  return {
    url,
    domain,
    timestamp: Date.now(),
    eventType: 'page_visit',
    title,
    textContent,
  };
}
