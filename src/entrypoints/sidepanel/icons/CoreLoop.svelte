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
  <!-- Dashed circle -->
  <circle cx="12" cy="12" r="9" stroke-dasharray="3 3" />
  <!-- Solid arc (top-right quadrant) -->
  <path d="M12 3a9 9 0 0 1 9 9" />
  <!-- Center dot -->
  <circle cx="12" cy="12" r="1.5" fill="currentColor" stroke="none" />
  <!-- Vertical lines -->
  <line x1="12" y1="6" x2="12" y2="8" />
  <line x1="12" y1="16" x2="12" y2="18" />
</svg>
