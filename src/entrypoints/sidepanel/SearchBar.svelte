<script lang="ts">
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
  </div>
  <button type="submit" class="submit-btn" disabled={loading || !query.trim()}>
    {#if loading}
      Searching...
    {:else}
      Search
    {/if}
  </button>
  {#if !modelReady}
    <p class="model-status">Loading model...</p>
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
  }

  input {
    width: 100%;
    padding: 8px 32px 8px 12px;
    border: 1px solid var(--border);
    border-radius: 6px;
    background: var(--bg-card);
    color: var(--text);
    font-size: 14px;
    outline: none;
    transition: border-color 0.15s;
  }

  input::placeholder {
    color: var(--text-muted);
  }

  input:focus {
    border-color: var(--accent);
  }

  input:disabled {
    opacity: 0.6;
  }

  .clear-btn {
    position: absolute;
    right: 6px;
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
    border: none;
    border-radius: 6px;
    background: var(--accent);
    color: var(--bg-card);
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    transition: background 0.15s;
  }

  .submit-btn:hover:not(:disabled) {
    background: var(--accent-dim);
  }

  .submit-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .model-status {
    margin: 0;
    font-size: 12px;
    color: var(--text-muted);
  }
</style>
