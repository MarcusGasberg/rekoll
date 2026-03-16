import { Readability } from '@mozilla/readability';
import type { ExtensionMessage, PageCapturedMessage } from '@/shared/types';
import { findExtractor, getAllInteractionSpecs } from '@/extractors/registry';
import { genericSpecs } from '@/extractors/generic-specs';
import {
  startInteractionObserver,
  type InteractionEvent,
} from '@/extractors/interaction-observer';

export default defineContentScript({
  matches: ['<all_urls>'],
  runAt: 'document_idle',

  main() {
    let cleanupObserver: (() => void) | undefined;

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

    // Listen for form success events from main-world script
    document.addEventListener('__bcc_form_success', ((
      event: CustomEvent<Record<string, unknown>>,
    ) => {
      const detail = event.detail;
      const message: PageCapturedMessage = {
        type: 'PAGE_CAPTURED',
        data: {
          url: (detail.pageUrl as string) ?? location.href,
          domain: location.hostname,
          timestamp: (detail.timestamp as number) ?? Date.now(),
          eventType: 'form_submit',
          title: (detail.pageTitle as string) ?? document.title,
          textContent: 'Form Submit',
          metadata: {
            formAction: detail.formAction,
            formId: detail.formId,
            action: 'form_submit',
          },
        },
      };
      browser.runtime.sendMessage(message).catch((err) => {
        console.error('[content] Failed to send form event:', err);
      });
    }) as EventListener);

    // Initial capture + setup
    capturePage();
    setupInteractions();

    // Check for SPA listener from matched extractor
    const extractor = findExtractor(location.href);
    if (extractor?.setupSpaListener) {
      extractor.setupSpaListener(() => {
        capturePage();
        // Re-setup interactions for new page
        cleanupObserver?.();
        setupInteractions();
      });
    }

    function setupInteractions() {
      const siteSpecs = getAllInteractionSpecs(location.href);
      const allSpecs = [...siteSpecs, ...genericSpecs];
      if (allSpecs.length === 0) return;

      cleanupObserver = startInteractionObserver(allSpecs, onInteraction);
    }

    function onInteraction(result: InteractionEvent) {
      const message: PageCapturedMessage = {
        type: 'PAGE_CAPTURED',
        data: {
          url: location.href,
          domain: location.hostname,
          timestamp: Date.now(),
          eventType: result.eventType,
          title: document.title,
          textContent: result.label ?? result.eventType,
          metadata: result.metadata,
        },
      };

      browser.runtime.sendMessage(message).catch((err) => {
        console.error('[content] Failed to send interaction:', err);
      });
    }
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

  // Try site-specific extractor first
  const extractor = findExtractor(url);
  let extractorResult = extractor?.extractOnLoad(document, new URL(url)) ?? null;

  // Use Readability for main content extraction (as fallback or gap-filler)
  let readabilityText = '';
  try {
    const clone = document.cloneNode(true) as Document;
    const article = new Readability(clone).parse();
    if (article?.textContent) {
      readabilityText = article.textContent.trim();
    }
  } catch {
    // Readability can fail on some pages
  }

  // Fallback: meta description + truncated body text
  if (!readabilityText) {
    const metaDesc =
      document
        .querySelector('meta[name="description"]')
        ?.getAttribute('content') ?? '';
    const bodyText = document.body?.innerText ?? '';
    readabilityText = [metaDesc, bodyText].filter(Boolean).join('\n');
  }

  readabilityText = readabilityText.slice(0, 2000);

  if (extractorResult) {
    // Extractor result wins, Readability fills gaps
    return {
      url,
      domain,
      timestamp: Date.now(),
      eventType: extractorResult.eventType,
      title: extractorResult.title || title,
      textContent: extractorResult.textContent || readabilityText,
      metadata: extractorResult.metadata,
    };
  }

  // No extractor matched — plain page visit
  return {
    url,
    domain,
    timestamp: Date.now(),
    eventType: 'page_visit',
    title,
    textContent: readabilityText,
  };
}
