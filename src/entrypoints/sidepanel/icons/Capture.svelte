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
  <!-- Viewfinder corners -->
  <path d="M4 8V4h4" />
  <path d="M20 8V4h-4" />
  <path d="M4 16v4h4" />
  <path d="M20 16v4h-4" />
  <!-- Center circle -->
  <circle cx="12" cy="12" r="3" />
  <!-- Crosshair ticks -->
  <line x1="12" y1="5" x2="12" y2="7" />
  <line x1="12" y1="17" x2="12" y2="19" />
  <line x1="5" y1="12" x2="7" y2="12" />
  <line x1="17" y1="12" x2="19" y2="12" />
</svg>
