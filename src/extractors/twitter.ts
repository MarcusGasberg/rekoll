import type { SiteExtractor, ExtractorResult, InteractionSpec } from './types';

function getTweetText(doc: Document): string {
  return (
    doc.querySelector('[data-testid="tweetText"]')?.textContent?.trim() ?? ''
  );
}

function getAuthor(doc: Document): string {
  return (
    doc.querySelector('[data-testid="User-Name"]')?.textContent?.trim() ?? ''
  );
}

function nearestTweetText(el: Element): string {
  // Walk up to find the tweet article, then get its text
  const article = el.closest('article');
  if (!article) return '';
  return (
    article.querySelector('[data-testid="tweetText"]')?.textContent?.trim() ??
    ''
  );
}

export const twitterExtractor: SiteExtractor = {
  extractOnLoad(doc: Document, url: URL): ExtractorResult | null {
    if (!url.pathname.includes('/status/')) return null;

    const author = getAuthor(doc);
    const text = getTweetText(doc);
    if (!text) return null;

    return {
      eventType: 'page_visit',
      title: `${author}: ${text.slice(0, 80)}`,
      textContent: `Tweet by ${author}: ${text}`.slice(0, 2000),
      metadata: { author, tweetUrl: url.href },
    };
  },

  getInteractionSpecs(): InteractionSpec[] {
    return [
      {
        selector: '[data-testid="like"]',
        eventType: 'like',
        label: 'Twitter Like',
        extractMetadata(el) {
          const text = nearestTweetText(el);
          return text ? { tweetText: text, action: 'like' } : null;
        },
      },
      {
        selector: '[data-testid="retweet"]',
        eventType: 'like',
        label: 'Twitter Retweet',
        extractMetadata(el) {
          const text = nearestTweetText(el);
          return text ? { tweetText: text, action: 'retweet' } : null;
        },
      },
    ];
  },
};
