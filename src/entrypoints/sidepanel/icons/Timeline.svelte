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
  <!-- Dashed vertical line -->
  <line x1="12" y1="2" x2="12" y2="22" stroke-dasharray="3 3" />
  <!-- Upper node (offset left) -->
  <circle cx="8" cy="8" r="2.5" fill="currentColor" stroke="currentColor" />
  <line x1="10.5" y1="8" x2="12" y2="8" />
  <!-- Lower node (offset right) -->
  <circle cx="16" cy="16" r="2.5" fill="currentColor" stroke="currentColor" />
  <line x1="13.5" y1="16" x2="12" y2="16" />
</svg>
