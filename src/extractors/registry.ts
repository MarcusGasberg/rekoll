import type { SiteExtractor, InteractionSpec } from './types';
import { youtubeExtractor } from './youtube';
import { amazonExtractor } from './amazon';
import { twitterExtractor } from './twitter';
import { redditExtractor } from './reddit';

interface ExtractorEntry {
  pattern: URLPattern;
  extractor: SiteExtractor;
}

const registry: ExtractorEntry[] = [
  {
    pattern: new URLPattern({ hostname: '{www.}?youtube.com' }),
    extractor: youtubeExtractor,
  },
  {
    pattern: new URLPattern({ hostname: '{www.}?amazon.{com,co.uk,de,fr,co.jp,ca,com.au}' }),
    extractor: amazonExtractor,
  },
  {
    pattern: new URLPattern({ hostname: '{www.}?{twitter.com,x.com}' }),
    extractor: twitterExtractor,
  },
  {
    pattern: new URLPattern({ hostname: '{www.}?{reddit.com,old.reddit.com}' }),
    extractor: redditExtractor,
  },
];

export function findExtractor(url: string): SiteExtractor | null {
  for (const entry of registry) {
    if (entry.pattern.test(url)) {
      return entry.extractor;
    }
  }
  return null;
}

export function getAllInteractionSpecs(url: string): InteractionSpec[] {
  const specs: InteractionSpec[] = [];
  for (const entry of registry) {
    if (entry.pattern.test(url) && entry.extractor.getInteractionSpecs) {
      specs.push(...entry.extractor.getInteractionSpecs());
    }
  }
  return specs;
}
