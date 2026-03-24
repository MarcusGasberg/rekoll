<script lang="ts">
  import { Capture } from './icons';

  interface Props {
    event: {
      id?: number;
      url: string;
      domain: string;
      timestamp: number;
      eventType: string;
      title: string;
      textContent: string;
      metadata?: Record<string, unknown>;
    };
    score?: number;
    query?: string;
    matchType?: 'semantic' | 'keyword' | 'both';
  }

  let { event, score, query, matchType }: Props = $props();

  function relativeTime(timestamp: number): string {
    const seconds = Math.floor((Date.now() - timestamp) / 1000);
    if (seconds < 60) return `${seconds}s ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 30) return `${days}d ago`;
    const months = Math.floor(days / 30);
    if (months < 12) return `${months}mo ago`;
    const years = Math.floor(months / 12);
    return `${years}y ago`;
  }

  let timeAgo = $derived(relativeTime(event.timestamp));

  let snippet = $derived(
    event.textContent.length > 150
      ? event.textContent.slice(0, 150) + '...'
      : event.textContent
  );

  let snippetSegments = $derived.by(() => {
    if (!query || !snippet) return [{ text: snippet ?? '', highlight: false }];
    const terms = query.toLowerCase().split(/\s+/).filter(t => t.length > 1);
    if (terms.length === 0) return [{ text: snippet, highlight: false }];
    const escaped = terms.map(t => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
    const pattern = new RegExp(`(${escaped.join('|')})`, 'gi');
    const segments: { text: string; highlight: boolean }[] = [];
    let lastIndex = 0;
    let match: RegExpExecArray | null;
    while ((match = pattern.exec(snippet)) !== null) {
      if (match.index > lastIndex) {
        segments.push({ text: snippet.slice(lastIndex, match.index), highlight: false });
      }
      segments.push({ text: match[1], highlight: true });
      lastIndex = pattern.lastIndex;
    }
    if (lastIndex < snippet.length) {
      segments.push({ text: snippet.slice(lastIndex), highlight: false });
    }
    return segments.length > 0 ? segments : [{ text: snippet, highlight: false }];
  });

  let metadataItems = $derived.by(() => {
    const meta = event.metadata;
    if (!meta || Object.keys(meta).length === 0) return [];

    const items: { label: string; value: string }[] = [];

    switch (event.eventType) {
      case 'video_watch': {
        if (meta.channel != null) items.push({ label: 'Channel:', value: String(meta.channel) });
        if (meta.viewCount != null) items.push({ label: 'Views:', value: String(meta.viewCount) });
        break;
      }
      case 'purchase': {
        if (meta.price != null) items.push({ label: 'Price:', value: String(meta.price) });
        break;
      }
      case 'like': {
        const liked = meta.videoTitle ?? meta.tweetText ?? meta.postTitle ?? meta.pageTitle;
        if (liked != null) items.push({ label: 'Liked:', value: String(liked) });
        break;
      }
      default: {
        const entries = Object.entries(meta).filter(([key]) => key !== 'action');
        for (const [key, val] of entries.slice(0, 3)) {
          items.push({ label: `${key}:`, value: String(val) });
        }
        break;
      }
    }

    return items;
  });
</script>

<article class="card">
  <header>
    <a href={event.url} target="_blank" rel="noopener noreferrer" class="title">
      {event.title}
    </a>
    <span class="time">{timeAgo}</span>
  </header>

  <div class="tags">
    <span class="badge domain">{event.domain}</span>
    <span class="badge event-type event-type--{event.eventType}">{#if event.eventType === 'page_visit'}<Capture size={10} />&nbsp;{/if}{event.eventType}</span>
    {#if score != null}
      <span class="badge score">{Math.round(score * 100)}%</span>
    {/if}
    {#if matchType}<span class="badge match-type match-type--{matchType}">{matchType}</span>{/if}
  </div>

  {#if snippet}
    <p class="snippet">{#each snippetSegments as segment, i (i)}{#if segment.highlight}<mark>{segment.text}</mark>{:else}{segment.text}{/if}{/each}</p>
  {/if}

  {#if metadataItems.length > 0}
    <div class="metadata">
      {#each metadataItems as item (item.label)}
        <span class="meta-item"><span class="meta-label">{item.label}</span> {item.value}</span>
      {/each}
    </div>
  {/if}
</article>

<style>
  .card {
    background: rgba(23, 23, 23, 0.6);
    border: 1px solid var(--border);
    border-radius: 12px;
    padding: 12px;
    transition: all 0.15s ease;
  }

  .card:hover {
    background: var(--bg-card-hover);
    border-color: var(--border-hover);
  }

  header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 8px;
    margin-bottom: 8px;
  }

  .title {
    color: var(--text);
    text-decoration: none;
    font-size: 14px;
    font-weight: 500;
    line-height: 1.3;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    min-width: 0;
    flex: 1;
  }

  .title:hover {
    color: #fff;
  }

  .time {
    color: var(--text-dim);
    font-size: 10px;
    white-space: nowrap;
    flex-shrink: 0;
  }

  .tags {
    display: flex;
    gap: 6px;
    flex-wrap: wrap;
    margin-bottom: 8px;
  }

  .badge {
    font-size: 10px;
    font-weight: 500;
    padding: 2px 8px;
    border-radius: 4px;
    background: var(--tag-bg);
    border: 1px solid var(--border);
    color: var(--text-muted);
    white-space: nowrap;
  }

  .event-type {
    text-transform: uppercase;
    letter-spacing: 0.05em;
    font-weight: 600;
    color: var(--text-secondary);
    display: inline-flex;
    align-items: center;
  }

  .event-type--video_watch {
    border-color: rgba(30, 64, 175, 0.6);
    color: #60a5fa;
  }

  .event-type--purchase {
    border-color: rgba(22, 101, 52, 0.6);
    color: #4ade80;
  }

  .event-type--like {
    border-color: rgba(157, 23, 77, 0.6);
    color: #f472b6;
  }

  .event-type--page_visit {
    border-color: var(--border-hover);
    color: var(--text-secondary);
  }

  .score {
    background: rgba(64, 64, 64, 0.5);
    color: var(--text);
    font-weight: 500;
    margin-left: auto;
  }

  .snippet {
    color: var(--text-muted);
    font-size: 12px;
    line-height: 1.6;
    margin: 0;
    word-break: break-word;
  }

  .metadata {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    margin-top: 6px;
  }

  .meta-item {
    font-size: 11px;
    color: var(--text-dim);
    background: rgba(38, 38, 38, 0.5);
    padding: 2px 6px;
    border-radius: 4px;
  }

  .meta-label {
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    font-size: 9px;
    color: var(--text-dim);
  }

  .snippet mark {
    background: rgba(250, 204, 21, 0.25);
    color: var(--text);
    border-radius: 2px;
    padding: 0 1px;
  }

  .match-type {
    font-size: 9px;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .match-type--semantic {
    border-color: rgba(139, 92, 246, 0.4);
    color: #a78bfa;
  }

  .match-type--keyword {
    border-color: rgba(251, 191, 36, 0.4);
    color: #fbbf24;
  }

  .match-type--both {
    border-color: rgba(52, 211, 153, 0.4);
    color: #34d399;
  }
</style>
