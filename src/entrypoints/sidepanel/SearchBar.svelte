<script lang="ts">
  import { RecallAi, LocalEngine, CoreLoop } from './icons';

  interface Props {
    onsearch: (query: string) => void;
    onreset: () => void;
    loading: boolean;
    modelReady: boolean;
  }

  let { onsearch, onreset, loading, modelReady }: Props = $props();

  let query = $state('');

  const HISTORY_KEY = 'kek-search-history';
  const MAX_HISTORY = 10;

  let showHistory = $state(false);
  let activeIndex = $state(-1);

  let searchHistory = $state<string[]>(
    JSON.parse(localStorage.getItem(HISTORY_KEY) ?? '[]')
  );

  let dropdownVisible = $derived(showHistory && !query && searchHistory.length > 0);

  function saveToHistory(q: string) {
    searchHistory = [q, ...searchHistory.filter(h => h !== q)].slice(0, MAX_HISTORY);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(searchHistory));
  }

  function handleHistoryClick(q: string) {
    query = q;
    showHistory = false;
    activeIndex = -1;
    onsearch(q);
  }

  function handleKeydown(e: KeyboardEvent) {
    if (!dropdownVisible) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        activeIndex = (activeIndex + 1) % searchHistory.length;
        break;
      case 'ArrowUp':
        e.preventDefault();
        activeIndex = activeIndex <= 0 ? searchHistory.length - 1 : activeIndex - 1;
        break;
      case 'Enter':
        if (activeIndex >= 0) {
          e.preventDefault();
          handleHistoryClick(searchHistory[activeIndex]);
        }
        break;
      case 'Escape':
        e.preventDefault();
        showHistory = false;
        activeIndex = -1;
        break;
    }
  }

  function handleSubmit(e: SubmitEvent) {
    e.preventDefault();
    const trimmed = query.trim();
    if (trimmed) {
      onsearch(trimmed);
      saveToHistory(trimmed);
    }
  }

  function handleClear() {
    query = '';
    onreset();
  }
</script>

<form class="search-bar" onsubmit={handleSubmit}>
  <div class="input-wrapper">
    <span class="input-icon">
      <RecallAi size={14} />
    </span>
    <input
      type="text"
      bind:value={query}
      placeholder="Search your browsing history..."
      disabled={loading}
      onfocus={() => { showHistory = true; activeIndex = -1; }}
      onblur={() => { setTimeout(() => { showHistory = false; }, 150); }}
      onkeydown={handleKeydown}
      role="combobox"
      aria-expanded={dropdownVisible}
      aria-autocomplete="list"
      aria-controls="search-history-listbox"
      aria-activedescendant={activeIndex >= 0 ? `history-item-${activeIndex}` : undefined}
    />
    {#if query.length > 0}
      <button type="button" class="clear-btn" onclick={handleClear} aria-label="Clear search">
        &times;
      </button>
    {/if}
    <button type="submit" class="submit-btn" disabled={loading || !query.trim()} aria-label="Search">
      {#if loading}
        <CoreLoop size={14} class="icon-spin" />
      {:else}
        <RecallAi size={14} />
      {/if}
    </button>
  </div>
  {#if dropdownVisible}
    <ul class="history-dropdown" role="listbox" id="search-history-listbox">
      {#each searchHistory as item, index (item)}
        <li role="option" id={`history-item-${index}`} aria-selected={index === activeIndex}>
          <button type="button" class:active={index === activeIndex} onclick={() => handleHistoryClick(item)}>{item}</button>
        </li>
      {/each}
    </ul>
  {/if}
  {#if !modelReady}
    <p class="model-status"><LocalEngine size={12} /> Loading model...</p>
  {/if}
</form>

<style>
  .search-bar {
    position: relative;
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .input-wrapper {
    position: relative;
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .input-icon {
    position: absolute;
    left: 10px;
    top: 50%;
    transform: translateY(-50%);
    color: var(--text-dim);
    display: flex;
    z-index: 1;
    pointer-events: none;
  }

  input {
    flex: 1;
    min-width: 0;
    padding: 8px 32px 8px 32px;
    border: 1px solid var(--border);
    border-radius: 6px;
    background: var(--bg);
    color: var(--text);
    font-size: 14px;
    outline: none;
    transition: border-color 0.15s;
  }

  input::placeholder {
    color: var(--text-dim);
  }

  input:focus {
    border-color: var(--border-hover);
  }

  input:disabled {
    opacity: 0.6;
  }

  .clear-btn {
    position: absolute;
    right: 70px;
    background: none;
    border: none;
    color: var(--text-muted);
    font-size: 18px;
    cursor: pointer;
    padding: 2px 6px;
    line-height: 1;
    border-radius: 4px;
  }

  .clear-btn:hover {
    color: var(--text);
    background: var(--tag-bg);
  }

  .submit-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    vertical-align: middle;
    padding: 8px 16px;
    border: 1px solid var(--border);
    border-radius: 8px;
    background: var(--tag-bg);
    color: var(--text);
    font-size: 13px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.15s;
    flex-shrink: 0;
  }

  .submit-btn:hover:not(:disabled) {
    background: var(--bg-card-hover);
    border-color: var(--border-hover);
  }

  .submit-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .history-dropdown {
    position: absolute;
    top: 100%;
    left: 0;
    right: 0;
    margin: 4px 0 0;
    padding: 4px 0;
    list-style: none;
    background: var(--bg-card);
    border: 1px solid var(--border);
    border-radius: 8px;
    z-index: 10;
    max-height: 200px;
    overflow-y: auto;
  }

  .history-dropdown li button {
    width: 100%;
    text-align: left;
    padding: 6px 12px;
    background: none;
    border: none;
    color: var(--text-muted);
    font-size: 13px;
    cursor: pointer;
  }

  .history-dropdown li button:hover,
  .history-dropdown li button.active {
    background: var(--bg-card-hover);
    color: var(--text);
  }

  .model-status {
    margin: 0;
    font-size: 10px;
    color: var(--text-muted);
    text-transform: uppercase;
    letter-spacing: 0.05em;
    display: flex;
    align-items: center;
    gap: 4px;
  }
</style>
