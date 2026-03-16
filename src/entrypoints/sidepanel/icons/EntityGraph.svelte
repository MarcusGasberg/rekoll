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
  <!-- Connecting lines -->
  <line x1="8" y1="8" x2="16" y2="8" />
  <line x1="8" y1="8" x2="12" y2="18" />
  <line x1="16" y1="8" x2="12" y2="18" />
  <!-- Three circles (nodes) -->
  <circle cx="8" cy="8" r="3" fill="var(--bg, #0a0a0a)" />
  <circle cx="16" cy="8" r="3" fill="var(--bg, #0a0a0a)" />
  <circle cx="12" cy="18" r="3" fill="var(--bg, #0a0a0a)" />
</svg>
