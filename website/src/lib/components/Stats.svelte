<script lang="ts">
	import { Tween } from 'svelte/motion';
	import { cubicOut } from 'svelte/easing';
	import { intersect } from '$lib/actions/intersect';

	const stats = [
		{ value: 14205, suffix: '', label: 'Entities Extracted' },
		{ value: 8492, suffix: '', label: 'Connections Made' },
		{ value: 0, suffix: '', label: 'Cloud Uploads' },
		{ value: 42, suffix: 'ms', label: 'Recall Time' }
	];

	const counters = stats.map(() =>
		new Tween(0, { duration: 2500, easing: cubicOut })
	);

	let triggered = false;

	function handleIntersect() {
		if (triggered) return;
		triggered = true;
		stats.forEach((stat, i) => {
			counters[i].set(stat.value);
		});
	}
</script>

<section
	id="stats"
	class="relative py-24 px-6 border-y border-neutral-800"
	use:intersect={{ threshold: 0.3, onIntersect: handleIntersect }}
>
	<div class="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8">
		{#each stats as stat, i (stat.label)}
			<div class="text-center">
				<div class="text-4xl sm:text-5xl font-light text-white mb-2 tabular-nums tracking-tight">
					{Math.round(counters[i].current).toLocaleString()}{stat.suffix}
				</div>
				<div class="text-xs text-neutral-500 uppercase tracking-widest">{stat.label}</div>
			</div>
		{/each}
	</div>
</section>
