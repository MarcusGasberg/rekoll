<script lang="ts">
  interface Props {
    event: {
      id?: number;
      url: string;
      domain: string;
      timestamp: number;
      eventType: string;
      title: string;
      textContent: string;
    };
  }

  let { event }: Props = $props();

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
    <span class="badge event-type">{event.eventType}</span>
  </div>

  {#if snippet}
    <p class="snippet">{snippet}</p>
  {/if}
</article>

<style>
  .card {
    background: var(--bg-card);
    border: 1px solid var(--border);
    border-radius: 8px;
    padding: 12px;
    transition: background 0.15s ease, border-color 0.15s ease;
  }

  .card:hover {
    background: var(--bg-card-hover);
    border-color: var(--accent);
  }

  header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 8px;
    margin-bottom: 8px;
  }

  .title {
    color: var(--accent);
    text-decoration: none;
    font-size: 14px;
    font-weight: 600;
    line-height: 1.3;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    min-width: 0;
    flex: 1;
  }

  .title:hover {
    text-decoration: underline;
  }

  .time {
    color: var(--text-muted);
    font-size: 12px;
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
    font-size: 11px;
    padding: 2px 8px;
    border-radius: 4px;
    background: var(--tag-bg);
    color: var(--text-muted);
    white-space: nowrap;
  }

  .event-type {
    background: var(--accent);
    color: var(--bg-card);
    font-weight: 500;
  }

  .snippet {
    color: var(--text-muted);
    font-size: 13px;
    line-height: 1.5;
    margin: 0;
    word-break: break-word;
  }
</style>
