<script lang="ts">
  import type { BrowsingEvent, EventsResultMessage, EventType } from '@/shared/types';
  import type { SearchResponse, SearchResult, ModelStatusResponse } from '@/shared/messages';
  import ResultCard from './ResultCard.svelte';
  import SearchBar from './SearchBar.svelte';
  import EventTypeFilter from './EventTypeFilter.svelte';
  import { CoreLoop, Timeline, RecallAi } from './icons';

  let events: BrowsingEvent[] = $state([]);
  let loading = $state(true);
  let searchResults: SearchResult[] = $state([]);
  let searching = $state(false);
  let searchMode = $state(false);
  let modelReady = $state(false);
  let eventTypeFilter: EventType | null = $state(null);

  let filteredEvents = $derived(
    eventTypeFilter ? events.filter((e) => e.eventType === eventTypeFilter) : events
  );

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
        ...(eventTypeFilter ? { filters: { eventType: eventTypeFilter } } : {}),
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
      <CoreLoop size={18} />
      <h1 class="title">Browsing Events</h1>
      <span class="count">{searchMode ? searchResults.length : filteredEvents.length}</span>
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

  <div class="filter-section">
    <EventTypeFilter
      selected={eventTypeFilter}
      onchange={(type) => { eventTypeFilter = type; }}
    />
  </div>

  <main class="content">
    {#if searchMode}
      {#if searching}
        <div class="status">
          <CoreLoop size={24} class="icon-spin" />
          <p>Searching...</p>
        </div>
      {:else if searchResults.length === 0}
        <div class="status">
          <RecallAi size={32} />
          <p>No results found.</p>
        </div>
      {:else}
        <div class="event-list">
          {#each searchResults as result, i (i)}
            <ResultCard event={result.event} score={result.score} />
          {/each}
        </div>
      {/if}
    {:else if loading && filteredEvents.length === 0}
      <div class="status">
        <CoreLoop size={24} class="icon-spin" />
        <p>Loading events...</p>
      </div>
    {:else if filteredEvents.length === 0}
      <div class="status">
        <Timeline size={32} />
        <p>No events recorded yet.</p>
      </div>
    {:else}
      <div class="event-list">
        {#each filteredEvents as event (event.id ?? event.timestamp)}
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
    background: rgba(23, 23, 23, 0.8);
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    flex-shrink: 0;
  }

  .header-left {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .title {
    font-size: 15px;
    font-weight: 300;
  }

  .count {
    font-size: 10px;
    font-weight: 500;
    color: var(--text-muted);
    background: var(--tag-bg);
    border: 1px solid var(--border);
    padding: 2px 8px;
    border-radius: 9999px;
  }

  .refresh-btn {
    background: var(--tag-bg);
    color: var(--text-muted);
    border: 1px solid var(--border);
    padding: 6px 14px;
    border-radius: 8px;
    font-size: 12px;
    cursor: pointer;
    transition: all 0.15s;
  }

  .refresh-btn:hover:not(:disabled) {
    background: var(--bg-card-hover);
    border-color: var(--border-hover);
    color: var(--text);
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

  .filter-section {
    padding: 6px 16px;
    border-bottom: 1px solid var(--border);
    background: var(--bg-card);
    flex-shrink: 0;
  }

  .content {
    flex: 1;
    overflow-y: auto;
    padding: 12px 16px;
    scrollbar-width: thin;
    scrollbar-color: var(--border) transparent;
  }

  .content::-webkit-scrollbar {
    width: 6px;
  }

  .content::-webkit-scrollbar-track {
    background: transparent;
  }

  .content::-webkit-scrollbar-thumb {
    background: var(--border);
    border-radius: 3px;
  }

  .status {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 12px;
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
