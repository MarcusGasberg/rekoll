<script lang="ts">
	import { tilt } from '$lib/actions/tilt';
	import type { Snippet } from 'svelte';

	interface Props {
		title: string;
		description: string;
		icon: Snippet;
		class?: string;
	}

	let { title, description, icon, class: className = '' }: Props = $props();
</script>

<div
	use:tilt={{ max: 6, scale: 1.01 }}
	class="group rounded-xl border border-neutral-800 bg-neutral-900/60 p-6 transition-colors hover:border-neutral-700 {className}"
>
	<div class="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-neutral-800/60 text-neutral-400">
		{@render icon()}
	</div>
	<h3 class="text-sm font-medium text-neutral-200 mb-2">{title}</h3>
	<p class="text-sm text-neutral-500 leading-relaxed">{description}</p>
</div>
