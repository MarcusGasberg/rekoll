<script lang="ts">
  import { RecallAi, LocalEngine } from './icons';

  interface Props {
    onsearch: (query: string) => void;
    onreset: () => void;
    loading: boolean;
    modelReady: boolean;
  }

  let { onsearch, onreset, loading, modelReady }: Props = $props();

  let query = $state('');

  function handleSubmit(e: SubmitEvent) {
    e.preventDefault();
    const trimmed = query.trim();
    if (trimmed) {
      onsearch(trimmed);
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
    />
    {#if query.length > 0}
      <button type="button" class="clear-btn" onclick={handleClear} aria-label="Clear search">
        &times;
      </button>
    {/if}
    <button type="submit" class="submit-btn" disabled={loading || !query.trim()} aria-label="Search">
      {#if loading}
        Searching...
      {:else}
        <RecallAi size={14} />
      {/if}
    </button>
  </div>
  {#if !modelReady}
    <p class="model-status"><LocalEngine size={12} /> Loading model...</p>
  {/if}
</form>

<style>
  .search-bar {
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
    right: calc(16px + 70px);
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
