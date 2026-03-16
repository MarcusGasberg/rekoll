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
  <!-- Circle -->
  <circle cx="12" cy="12" r="9" />
  <!-- Diagonal slash -->
  <line x1="5.5" y1="5.5" x2="18.5" y2="18.5" />
</svg>
