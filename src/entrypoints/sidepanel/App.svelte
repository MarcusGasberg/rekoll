<script lang="ts">
  import type { BrowsingEvent, EventsResultMessage } from '@/shared/types';
  import type { SearchResponse, SearchResult, ModelStatusResponse } from '@/shared/messages';
  import ResultCard from './ResultCard.svelte';
  import SearchBar from './SearchBar.svelte';

  let events: BrowsingEvent[] = $state([]);
  let loading = $state(true);
  let searchResults: SearchResult[] = $state([]);
  let searching = $state(false);
  let searchMode = $state(false);
  let modelReady = $state(false);

  async function fetchEvents() {
    loading = true;
    try {
      const response: EventsResultMessage = await browser.runtime.sendMessage({
        type: 'GET_EVENTS',
        limit: 50,
      });
      if (response?.type === 'EVENTS_RESULT') {
        events = response.events;
      }
    } catch (err) {
      console.error('Failed to fetch events:', err);
    } finally {
      loading = false;
    }
  }

  async function handleSearch(query: string) {
    searching = true;
    searchMode = true;
    try {
      const response: SearchResponse = await browser.runtime.sendMessage({
        type: 'SEARCH',
        query,
        limit: 20,
      });
      if (response?.type === 'SEARCH_RESULT') {
        searchResults = response.results;
      }
    } catch (err) {
      console.error('Search failed:', err);
    } finally {
      searching = false;
    }
  }

  function handleReset() {
    searchResults = [];
    searchMode = false;
  }

  async function checkModelStatus() {
    try {
      const response: ModelStatusResponse = await browser.runtime.sendMessage({
        type: 'MODEL_STATUS',
      });
      if (response?.type === 'MODEL_STATUS_RESULT') {
        modelReady = response.ready;
      }
    } catch (err) {
      console.error('Failed to check model status:', err);
    }
  }

  $effect(() => {
    fetchEvents();
    checkModelStatus();
    const eventsInterval = setInterval(fetchEvents, 10_000);
    const modelInterval = setInterval(checkModelStatus, 5_000);
    return () => {
      clearInterval(eventsInterval);
      clearInterval(modelInterval);
    };
  });
</script>

<div class="panel">
  <header class="header">
    <div class="header-left">
      <h1 class="title">Browsing Events</h1>
      <span class="count">{searchMode ? searchResults.length : events.length}</span>
    </div>
    <button class="refresh-btn" onclick={fetchEvents} disabled={loading}>
      {loading ? 'Loading...' : 'Refresh'}
    </button>
  </header>

  <div class="search-section">
    <SearchBar
      onsearch={handleSearch}
      onreset={handleReset}
      loading={searching}
      {modelReady}
    />
  </div>

  <main class="content">
    {#if searchMode}
      {#if searching}
        <p class="status">Searching...</p>
      {:else if searchResults.length === 0}
        <p class="status">No results found.</p>
      {:else}
        <div class="event-list">
          {#each searchResults as result, i (i)}
            <ResultCard event={result.event} score={result.score} />
          {/each}
        </div>
      {/if}
    {:else if loading && events.length === 0}
      <p class="status">Loading events...</p>
    {:else if events.length === 0}
      <p class="status">No events recorded yet.</p>
    {:else}
      <div class="event-list">
        {#each events as event (event.id ?? event.timestamp)}
          <ResultCard {event} />
        {/each}
      </div>
    {/if}
  </main>
</div>

<style>
  .panel {
    display: flex;
    flex-direction: column;
    height: 100vh;
  }

  .header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 12px 16px;
    border-bottom: 1px solid var(--border);
    background: var(--bg-card);
    flex-shrink: 0;
  }

  .header-left {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .title {
    font-size: 15px;
    font-weight: 600;
  }

  .count {
    font-size: 11px;
    color: var(--text-muted);
    background: var(--tag-bg);
    padding: 2px 8px;
    border-radius: 10px;
  }

  .refresh-btn {
    background: var(--accent);
    color: #fff;
    border: none;
    padding: 6px 14px;
    border-radius: 6px;
    font-size: 12px;
    cursor: pointer;
    transition: background 0.15s;
  }

  .refresh-btn:hover:not(:disabled) {
    background: var(--accent-dim);
  }

  .refresh-btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .search-section {
    padding: 10px 16px;
    border-bottom: 1px solid var(--border);
    background: var(--bg-card);
    flex-shrink: 0;
  }

  .content {
    flex: 1;
    overflow-y: auto;
    padding: 12px 16px;
  }

  .status {
    text-align: center;
    color: var(--text-muted);
    padding: 32px 0;
  }

  .event-list {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
</style>
