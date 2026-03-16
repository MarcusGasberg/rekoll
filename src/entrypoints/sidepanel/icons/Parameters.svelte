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
  <!-- Top slider track -->
  <line x1="4" y1="9" x2="20" y2="9" />
  <circle cx="14" cy="9" r="2.5" fill="var(--bg, #0a0a0a)" />
  <!-- Bottom slider track -->
  <line x1="4" y1="15" x2="20" y2="15" />
  <circle cx="9" cy="15" r="2.5" fill="var(--bg, #0a0a0a)" />
</svg>
