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
  <!-- Dashed arc (trailing portion) -->
  <path d="M5.5 16A8 8 0 0 1 4 12a8 8 0 0 1 8-8" stroke-dasharray="3 3" />
  <!-- Solid arc (leading portion) -->
  <path d="M12 4a8 8 0 0 1 8 8 8 8 0 0 1-1.5 4.68" />
  <!-- Arrowhead -->
  <path d="M15 18l3.5 0.68L19.18 15" />
  <!-- Center dot -->
  <circle cx="12" cy="12" r="1.5" fill="currentColor" stroke="none" />
</svg>
