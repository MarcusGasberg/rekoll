import type { SiteExtractor, ExtractorResult, InteractionSpec } from './types';

function getSubreddit(url: URL): string {
  const match = url.pathname.match(/\/r\/([^/]+)/);
  return match?.[1] ?? '';
}

function extractSubredditFromPermalink(permalink: string | null | undefined): string {
  if (!permalink) return '';
  const match = permalink.match(/\/r\/([^/]+)/);
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
        selector: '[aria-label="upvote"]',
        eventType: 'like',
        label: 'Reddit Upvote',
        extractMetadata(el, doc) {
          const url = new URL(window.location.href);
          // Find the shreddit-post shadow host for accurate per-post context
          const root = el.getRootNode();
          const post = root instanceof ShadowRoot ? (root.host as Element) : null;
          const title = post?.getAttribute('post-title') ?? getPostTitle(doc);
          // Pull subreddit from the post element if not in the URL (e.g. front page)
          const subreddit =
            getSubreddit(url) ||
            post?.getAttribute('subreddit-prefixed-name')?.replace(/^r\//, '') ||
            extractSubredditFromPermalink(post?.getAttribute('permalink')) ||
            '';
          return { subreddit, postTitle: title, action: 'upvote' };
        },
      },
    ];
  },
};
