<script lang="ts">
  import type { EventType } from '@/shared/types';
  import { Parameters } from './icons';

  interface Props {
    selected: EventType | null;
    onchange: (type: EventType | null) => void;
  }

  let { selected, onchange }: Props = $props();

  const options: { label: string; value: EventType | null }[] = [
    { label: 'All', value: null },
    { label: 'Page Visit', value: 'page_visit' },
    { label: 'Video', value: 'video_watch' },
    { label: 'Purchase', value: 'purchase' },
    { label: 'Like', value: 'like' },
    { label: 'Form', value: 'form_submit' },
  ];

  function handleClick(value: EventType | null) {
    if (value === selected) {
      onchange(null);
    } else {
      onchange(value);
    }
  }
</script>

<div class="filter-row">
  <span class="filter-icon">
    <Parameters size={14} />
  </span>
  {#each options as option (option.label)}
    <button
      class="pill"
      class:active={selected === option.value}
      onclick={() => handleClick(option.value)}
    >
      {option.label}
    </button>
  {/each}
</div>

<style>
  .filter-icon {
    display: flex;
    align-items: center;
    color: var(--text-dim);
    flex-shrink: 0;
  }

  .filter-row {
    display: flex;
    align-items: center;
    gap: 6px;
    overflow-x: auto;
    scrollbar-width: none;
    -ms-overflow-style: none;
    padding: 2px 0;
  }

  .filter-row::-webkit-scrollbar {
    display: none;
  }

  .pill {
    flex-shrink: 0;
    padding: 4px 12px;
    border: 1px solid var(--border);
    border-radius: 9999px;
    background: transparent;
    color: var(--text-muted);
    font-size: 12px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.15s;
    white-space: nowrap;
    line-height: 1.4;
  }

  .pill:hover {
    background: rgba(38, 38, 38, 0.5);
    color: var(--text);
  }

  .pill.active {
    background: rgba(64, 64, 64, 0.6);
    color: var(--text);
    border-color: var(--border-hover);
  }
</style>
