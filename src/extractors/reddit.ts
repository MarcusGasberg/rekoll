import type { SiteExtractor, ExtractorResult, InteractionSpec } from './types';

function getSubreddit(url: URL): string {
  const match = url.pathname.match(/\/r\/([^/]+)/);
  return match?.[1] ?? '';
}

function getPostTitle(doc: Document): string {
  // Try standard h1 first
  const h1 = doc.querySelector('h1')?.textContent?.trim();
  if (h1) return h1;

  // Try shreddit-post (open shadow DOM)
  const post = doc.querySelector('shreddit-post');
  if (post?.shadowRoot) {
    const shadowH1 = post.shadowRoot.querySelector('h1')?.textContent?.trim();
    if (shadowH1) return shadowH1;
  }

  // Fallback to title attribute on shreddit-post
  return post?.getAttribute('post-title') ?? doc.title;
}

export const redditExtractor: SiteExtractor = {
  extractOnLoad(doc: Document, url: URL): ExtractorResult | null {
    if (!url.pathname.includes('/comments/')) return null;

    const subreddit = getSubreddit(url);
    const title = getPostTitle(doc);

    return {
      eventType: 'page_visit',
      title,
      textContent: `Reddit post in r/${subreddit}: ${title}`.slice(0, 2000),
      metadata: { subreddit, postUrl: url.href },
    };
  },

  getInteractionSpecs(): InteractionSpec[] {
    return [
      {
        selector: '[aria-label="upvote"], button[upvote]',
        eventType: 'like',
        label: 'Reddit Upvote',
        extractMetadata(_el, doc) {
          const url = new URL(window.location.href);
          const subreddit = getSubreddit(url);
          const title = getPostTitle(doc);
          return { subreddit, postTitle: title, action: 'upvote' };
        },
      },
    ];
  },
};
