<script lang="ts">
  let { size = 24, class: className = '' }: { size?: number; class?: string } = $props();
</script>

<svg
  width={size}
  height={size}
  viewBox="0 0 24 24"
  fill="none"
  stroke="currentColor"
  stroke-width="1.25"
  stroke-linecap="round"
  stroke-linejoin="round"
  class="icon {className}"
>
  <!-- Square body -->
  <rect x="6" y="6" width="12" height="12" rx="2" />
  <!-- Cross inside -->
  <line x1="12" y1="8" x2="12" y2="16" />
  <line x1="8" y1="12" x2="16" y2="12" />
  <!-- Pin connectors (top, bottom, left, right — 2 each) -->
  <line x1="9" y1="3" x2="9" y2="6" />
  <line x1="15" y1="3" x2="15" y2="6" />
  <line x1="9" y1="18" x2="9" y2="21" />
  <line x1="15" y1="18" x2="15" y2="21" />
  <line x1="3" y1="9" x2="6" y2="9" />
  <line x1="3" y1="15" x2="6" y2="15" />
  <line x1="18" y1="9" x2="21" y2="9" />
  <line x1="18" y1="15" x2="21" y2="15" />
</svg>
