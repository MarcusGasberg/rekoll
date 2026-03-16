import type { SiteExtractor, ExtractorResult, InteractionSpec } from './types';

function getVideoId(url: URL): string | null {
  // /shorts/<id> or /watch?v=<id>
  const shortsMatch = url.pathname.match(/^\/shorts\/([a-zA-Z0-9_-]+)/);
  if (shortsMatch) return shortsMatch[1];
  return url.searchParams.get('v');
}

function getTitle(doc: Document): string {
  return (
    doc.querySelector('h1.ytd-watch-metadata yt-formatted-string')
      ?.textContent?.trim() ??
    doc
      .querySelector('meta[property="og:title"]')
      ?.getAttribute('content')
      ?.trim() ??
    doc.title
  );
}

function getChannel(doc: Document): string {
  return (
    doc.querySelector('ytd-channel-name yt-formatted-string a')?.textContent?.trim() ??
    doc.querySelector('link[itemprop="name"]')?.getAttribute('content')?.trim() ??
    ''
  );
}

function getDescription(doc: Document): string {
  return (
    doc
      .querySelector('meta[property="og:description"]')
      ?.getAttribute('content')
      ?.trim() ?? ''
  );
}

function getViewCount(doc: Document): string {
  // The combined info line has "98M views  1 year ago  #hashtag ..." — grab first span
  const infoSpan = doc.querySelector('#info-container #info > span:first-child');
  if (infoSpan?.textContent?.trim()) return infoSpan.textContent.trim();

  // Fallback: meta tag (raw number, no formatting)
  const meta = doc.querySelector('meta[itemprop="interactionCount"]')?.getAttribute('content');
  if (meta) return meta;

  return '';
}

export const youtubeExtractor: SiteExtractor = {
  extractOnLoad(doc: Document, url: URL): ExtractorResult | null {
    const isWatch = url.pathname === '/watch';
    const isShort = url.pathname.startsWith('/shorts/');
    if (!isWatch && !isShort) return null;

    const videoId = getVideoId(url);
    if (!videoId) return null;

    const title = getTitle(doc);
    const channel = getChannel(doc);
    const description = getDescription(doc);
    const viewCount = isWatch ? getViewCount(doc) : '';

    return {
      eventType: 'video_watch',
      title,
      textContent: `${isShort ? 'Short' : 'Video'}: ${title} by ${channel}. ${description}`.slice(0, 2000),
      metadata: { videoId, channel, viewCount, ...(isShort && { format: 'short' }) },
    };
  },

  getInteractionSpecs(): InteractionSpec[] {
    return [
      {
        selector: 'like-button-view-model button, #segmented-like-button button, #like-button button',
        eventType: 'like',
        label: 'YouTube Like',
        extractMetadata(_el, doc) {
          const url = new URL(window.location.href);
          const videoId = getVideoId(url);
          const videoTitle = getTitle(doc);
          if (!videoId) return null;
          return { videoId, videoTitle, action: 'like' };
        },
      },
    ];
  },

  setupSpaListener(onNavigate: () => void): () => void {
    const handler = () => onNavigate();
    document.addEventListener('yt-navigate-finish', handler);
    return () => document.removeEventListener('yt-navigate-finish', handler);
  },
};
