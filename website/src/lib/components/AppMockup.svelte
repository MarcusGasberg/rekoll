<script lang="ts">
	import { intersect } from '$lib/actions/intersect';
	import { onDestroy } from 'svelte';
	import { flip } from 'svelte/animate';

	type Phase = 'capture' | 'embed' | 'search';

	let visible = $state(false);
	let phase: Phase = $state('capture');
	let capturedCount = $state(0);
	let selectedIndex = $state(0);
	let embeddingProgress = $state(-1);
	let embeddedSet = $state(new Set<number>());
	let searchText = $state('');
	let showScores = $state(false);
	let sortByRelevance = $state(false);
	let isPlaying = $state(false);
	let embeddingNumbers = $state<string>('[0.0000, 0.0000, 0.0000, 0.0000, 0.0000, 0.0000, ...]');

	let timeouts: ReturnType<typeof setTimeout>[] = [];
	let rafId: number | null = null;

	const chronologicalEvents = [
		{
			title: 'ONNX Runtime WebAssembly Performance',
			domain: 'onnxruntime.ai',
			type: 'page_visit',
			time: '5h ago',
			score: 73,
			meta: 'Section: Documentation · Last updated: 2 days ago'
		},
		{
			title: 'How to Build a Semantic Search Engine',
			domain: 'blog.example.com',
			type: 'page_visit',
			time: '3h ago',
			score: 79,
			meta: 'Reading time: 8 min · Category: Engineering'
		},
		{
			title: 'Andrej Karpathy: "Local-first AI is the future..."',
			domain: 'x.com',
			type: 'like',
			time: '2h ago',
			score: 84,
			meta: 'Author: @karpathy · 12.4K likes'
		},
		{
			title: 'SvelteKit 5 migration guide — megathread',
			domain: 'reddit.com',
			type: 'page_visit',
			time: '1h ago',
			score: 88,
			meta: 'Subreddit: r/sveltejs · 342 upvotes'
		},
		{
			title: 'Sony WH-1000XM5 Wireless Headphones',
			domain: 'amazon.com',
			type: 'purchase',
			time: '15m ago',
			score: 91,
			meta: 'Price: $278.00 · Category: Electronics'
		},
		{
			title: 'Understanding Vector Embeddings — 3Blue1Brown',
			domain: 'youtube.com',
			type: 'video_watch',
			time: '2m ago',
			score: 96,
			meta: 'Duration: 18:24 · Channel: 3Blue1Brown'
		}
	];

	const relevanceEvents = [...chronologicalEvents].sort((a, b) => b.score - a.score);

	const typeColors: Record<string, string> = {
		video_watch: 'border-blue-800/60 text-blue-400',
		purchase: 'border-green-800/60 text-green-400',
		page_visit: 'border-neutral-700 text-neutral-300',
		like: 'border-pink-800/60 text-pink-400'
	};

	function filterLabel(type: string) {
		return type.replace('_', ' ').replace(/\b\w/g, (c) => c.toUpperCase());
	}

	function scheduleTimeout(fn: () => void, delay: number) {
		const id = setTimeout(fn, delay);
		timeouts.push(id);
		return id;
	}

	function stopLoop() {
		isPlaying = false;
		for (const id of timeouts) clearTimeout(id);
		timeouts = [];
		if (rafId !== null) {
			cancelAnimationFrame(rafId);
			rafId = null;
		}
	}

	function resetState() {
		phase = 'capture';
		capturedCount = 0;
		selectedIndex = 0;
		embeddingProgress = -1;
		embeddedSet = new Set();
		searchText = '';
		showScores = false;
		sortByRelevance = false;
		embeddingNumbers = '[0.0000, 0.0000, 0.0000, 0.0000, 0.0000, 0.0000, ...]';
	}

	function randomEmbedding(): string {
		const nums = Array.from({ length: 6 }, () => (Math.random() * 2 - 1).toFixed(4));
		return `[${nums.join(', ')}, ...]`;
	}

	function settledEmbedding(eventIndex: number): string {
		const seeds = [
			'[0.0234, -0.1892, 0.4521, 0.0087, -0.3341, 0.2198, ...]',
			'[0.1456, -0.0723, 0.3187, -0.2045, 0.0891, -0.1567, ...]',
			'[-0.0891, 0.2345, -0.1678, 0.3901, -0.0234, 0.1789, ...]',
			'[0.2789, -0.3456, 0.0123, 0.1567, -0.2891, 0.0456, ...]',
			'[-0.1234, 0.0678, -0.3901, 0.2345, 0.1890, -0.0567, ...]',
			'[0.3456, -0.0891, 0.2234, -0.1678, 0.0345, -0.2901, ...]'
		];
		return seeds[eventIndex % seeds.length];
	}

	function animateEmbeddingNumbers(eventIndex: number, durationMs: number) {
		const start = performance.now();
		function tick() {
			const elapsed = performance.now() - start;
			if (elapsed >= durationMs) {
				embeddingNumbers = settledEmbedding(eventIndex);
				rafId = null;
				return;
			}
			embeddingNumbers = randomEmbedding();
			rafId = requestAnimationFrame(tick);
		}
		if (rafId !== null) cancelAnimationFrame(rafId);
		rafId = requestAnimationFrame(tick);
	}

	function runLoop() {
		resetState();
		isPlaying = true;

		// Phase 1: Capture (0–4.5s)
		const captureStagger = 700;
		for (let i = 0; i < chronologicalEvents.length; i++) {
			scheduleTimeout(() => {
				capturedCount = i + 1;
				selectedIndex = i;
			}, i * captureStagger);
		}

		const captureEnd = chronologicalEvents.length * captureStagger;

		// Phase 2: Embed (4.5s–8.5s)
		const embedDelay = 600;
		scheduleTimeout(() => {
			phase = 'embed';
		}, captureEnd);

		for (let i = 0; i < chronologicalEvents.length; i++) {
			scheduleTimeout(() => {
				embeddingProgress = i;
				selectedIndex = i;
				animateEmbeddingNumbers(i, 350);
			}, captureEnd + i * embedDelay);

			scheduleTimeout(() => {
				embeddedSet = new Set([...embeddedSet, i]);
			}, captureEnd + i * embedDelay + 400);
		}

		const embedEnd = captureEnd + chronologicalEvents.length * embedDelay + 400;

		// Phase 3: Search (8.5s–13s)
		const searchQuery = 'that video about embeddings';
		scheduleTimeout(() => {
			phase = 'search';
			embeddingProgress = -1;
		}, embedEnd);

		// Type out search query
		for (let i = 0; i < searchQuery.length; i++) {
			scheduleTimeout(() => {
				searchText = searchQuery.slice(0, i + 1);
			}, embedEnd + i * 60);
		}

		const typeEnd = embedEnd + searchQuery.length * 60;

		// Show scores after typing
		scheduleTimeout(() => {
			showScores = true;
		}, typeEnd + 200);

		// Reorder by relevance
		scheduleTimeout(() => {
			sortByRelevance = true;
			selectedIndex = 0;
		}, typeEnd + 600);

		// Hold final state, then reset
		const totalDuration = typeEnd + 600 + 2500;
		scheduleTimeout(() => {
			if (isPlaying) {
				runLoop();
			}
		}, totalDuration);
	}

	function startLoop() {
		if (isPlaying) return;
		runLoop();
	}

	let displayEvents = $derived.by(() => {
		if (sortByRelevance) return relevanceEvents;
		return chronologicalEvents.slice(0, capturedCount);
	});

	let selectedEvent = $derived.by(() => {
		const events = sortByRelevance ? relevanceEvents : chronologicalEvents.slice(0, capturedCount);
		return events[selectedIndex] ?? chronologicalEvents[0];
	});

	let titleBarText = $derived.by(() => {
		switch (phase) {
			case 'capture': return 'Rekoll — Capturing Events...';
			case 'embed': return 'Rekoll — Generating Embeddings...';
			case 'search': return 'Rekoll — Browsing Events';
			default: return 'Rekoll';
		}
	});

	const phaseSteps = [
		{ key: 'capture' as Phase, label: 'Capture' },
		{ key: 'embed' as Phase, label: 'Embed' },
		{ key: 'search' as Phase, label: 'Search' }
	];

	onDestroy(() => {
		stopLoop();
	});
</script>

<section
	id="how-it-works"
	class="relative py-24 px-6"
	use:intersect={{
		threshold: 0.1,
		once: false,
		onIntersect: () => { visible = true; startLoop(); },
		onUnintersect: () => { stopLoop(); visible = false; }
	}}
>
	<div class="max-w-5xl mx-auto">
		<div class="text-center mb-12">
			<h2 class="text-3xl sm:text-4xl font-light tracking-tight mb-4 text-white">
				See it in action
			</h2>
			<p class="text-neutral-400 text-lg max-w-2xl mx-auto">
				Watch the three-step workflow: capture your browsing, embed it semantically, then search by meaning.
			</p>
		</div>

		<!-- Mockup container -->
		<div
			class="mx-auto max-w-5xl rounded-2xl border border-neutral-800 bg-neutral-900/80 overflow-hidden shadow-2xl shadow-black/50 transition-all duration-700 {visible
				? 'opacity-100 translate-y-0'
				: 'opacity-0 translate-y-12'}"
		>
			<!-- Top gradient line -->
			<div class="h-px bg-gradient-to-r from-transparent via-neutral-600 to-transparent"></div>

			<!-- Window chrome -->
			<div class="flex items-center gap-2 px-4 py-3 border-b border-neutral-800 bg-neutral-900/50">
				<span class="w-3 h-3 rounded-full bg-neutral-800 border border-neutral-700"></span>
				<span class="w-3 h-3 rounded-full bg-neutral-800 border border-neutral-700"></span>
				<span class="w-3 h-3 rounded-full bg-neutral-800 border border-neutral-700"></span>
				<span class="ml-4 text-xs text-neutral-600">{titleBarText}</span>
			</div>

			<!-- Phase indicator strip -->
			<div class="flex items-center justify-center gap-6 px-4 py-2 border-b border-neutral-800 bg-neutral-950/50">
				{#each phaseSteps as step (step.key)}
					<div class="flex items-center gap-1.5">
						<span
							class="w-2 h-2 rounded-full transition-colors duration-300 {phase === step.key
								? 'bg-blue-400 shadow-[0_0_6px_rgba(96,165,250,0.5)]'
								: phase === 'search' && step.key !== 'search'
									? 'bg-green-500'
									: phase === 'embed' && step.key === 'capture'
										? 'bg-green-500'
										: 'bg-neutral-700'}"
						></span>
						<span class="text-[10px] uppercase tracking-wider {phase === step.key ? 'text-neutral-300' : 'text-neutral-600'}">{step.label}</span>
					</div>
				{/each}
			</div>

			<div class="flex flex-col md:flex-row min-h-[420px]">
				<!-- Left sidebar -->
				<div class="w-full md:w-64 border-b md:border-b-0 md:border-r border-neutral-800 flex flex-col">
					<!-- Search bar -->
					<div class="px-3 py-2.5 border-b border-neutral-800">
						<div class="px-3 py-1.5 rounded-lg bg-neutral-950 border transition-colors duration-300 {phase === 'search' ? 'border-blue-800/60' : 'border-neutral-800'} text-xs text-neutral-{phase === 'search' && searchText ? '300' : '600'} flex items-center">
							{#if phase === 'search' && searchText}
								<span>{searchText}</span><span class="ml-0.5 w-px h-3.5 bg-blue-400 inline-block" style="animation: cursor-blink 1s step-end infinite;"></span>
							{:else}
								Search by meaning...
							{/if}
						</div>
					</div>

					<!-- Filter pills (static, no interactivity) -->
					<div class="px-3 py-2 border-b border-neutral-800 flex gap-1.5 flex-wrap">
						<span class="text-[10px] px-2.5 py-0.5 rounded-full border bg-neutral-700/60 text-white border-neutral-700">All</span>
						{#each ['Page Visit', 'Video', 'Purchase', 'Like'] as filter (filter)}
							<span class="text-[10px] px-2.5 py-0.5 rounded-full border border-neutral-800 text-neutral-500">{filter}</span>
						{/each}
					</div>

					<!-- Event list -->
					<div class="relative flex-1 overflow-hidden">
						<div class="p-2 flex flex-col gap-1">
							{#each displayEvents as event, i (event.title)}
								<div
									animate:flip={{ duration: 400 }}
									class="w-full text-left rounded-lg p-2.5 transition-all duration-300 {selectedIndex === i
										? 'bg-neutral-800/80 border border-neutral-700'
										: 'border border-transparent'} {!sortByRelevance
										? 'animate-slide-in'
										: ''}"
									style="{embeddingProgress === i && phase === 'embed' ? 'animation: embed-process 0.6s ease-in-out;' : ''}"
								>
									<div class="flex items-center gap-1.5 mb-1">
										{#if embeddedSet.has(chronologicalEvents.indexOf(event))}
											<span class="w-1.5 h-1.5 rounded-full bg-green-500 shrink-0"></span>
										{/if}
										<div class="text-xs font-medium text-neutral-200 truncate">{event.title}</div>
									</div>
									<div class="flex items-center gap-1.5">
										<span class="text-[10px] text-neutral-600">{event.domain}</span>
										<span class="text-[10px] px-1.5 py-0.5 rounded border uppercase font-semibold tracking-wider {typeColors[event.type] ?? 'border-neutral-700 text-neutral-300'}">{filterLabel(event.type)}</span>
										{#if showScores}
											<span class="text-[10px] px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-300 font-medium" style="animation: score-pop 0.3s ease-out both; animation-delay: {i * 80}ms;">{event.score}%</span>
										{/if}
									</div>
								</div>
							{/each}
						</div>
						<!-- Progressive blur at bottom -->
						<div class="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-neutral-900/80 to-transparent pointer-events-none"></div>
					</div>
				</div>

				<!-- Right content pane -->
				<div class="flex-1 p-6">
					{#if capturedCount > 0}
						{#each [selectedEvent] as selected (selected.title)}
							<div class="mb-6">
								<h3 class="text-base font-medium text-neutral-200 mb-2">{selected.title}</h3>
								<div class="flex items-center gap-2 flex-wrap">
									<span class="text-[11px] px-2 py-0.5 rounded bg-neutral-800 border border-neutral-800 text-neutral-500">{selected.domain}</span>
									<span class="text-[11px] px-2 py-0.5 rounded border uppercase font-semibold tracking-wider {typeColors[selected.type] ?? 'border-neutral-700 text-neutral-300'}">{filterLabel(selected.type)}</span>
									{#if showScores}
										<span class="text-[11px] px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 font-medium" style="animation: score-pop 0.3s ease-out both;">{selected.score}% match</span>
									{/if}
									<span class="text-[11px] text-neutral-600">{selected.time}</span>
								</div>
							</div>

							<!-- Metadata -->
							<div class="mb-6 px-3 py-2 rounded-lg border border-neutral-800 bg-neutral-900/40">
								<span class="text-[11px] text-neutral-500">{selected.meta}</span>
							</div>

							<!-- Skeleton content lines -->
							<div class="space-y-3">
								<div class="h-3 rounded bg-neutral-800/60 w-full" style="animation: pulse-skeleton 2s ease-in-out infinite;"></div>
								<div class="h-3 rounded bg-neutral-800/60 w-[90%]" style="animation: pulse-skeleton 2s ease-in-out 0.2s infinite;"></div>
								<div class="h-3 rounded bg-neutral-800/60 w-[75%]" style="animation: pulse-skeleton 2s ease-in-out 0.4s infinite;"></div>
								<div class="h-3 rounded bg-neutral-800/60 w-[85%]" style="animation: pulse-skeleton 2s ease-in-out 0.6s infinite;"></div>
								<div class="h-3 rounded bg-neutral-800/60 w-[60%]" style="animation: pulse-skeleton 2s ease-in-out 0.8s infinite;"></div>
							</div>

							<!-- Embedding preview -->
							<div class="mt-8 px-3 py-2 rounded-lg border transition-colors duration-300 {phase === 'embed' ? 'border-blue-800/40 bg-blue-950/20' : 'border-neutral-800 bg-neutral-900/40'}">
								<div class="text-[10px] text-neutral-600 uppercase tracking-wider mb-1">Embedding Preview</div>
								<div class="text-[11px] font-mono truncate {phase === 'embed' ? 'text-blue-300' : 'text-neutral-500'}">
									{embeddingNumbers}
								</div>
							</div>
						{/each}
					{:else}
						<div class="flex items-center justify-center h-full text-neutral-600 text-sm">
							Waiting for events...
						</div>
					{/if}
				</div>
			</div>
		</div>
	</div>
</section>

<style>
	.animate-slide-in {
		animation: slide-in 0.3s ease-out both;
	}

	@keyframes slide-in {
		from {
			opacity: 0;
			transform: translateX(-16px);
		}
		to {
			opacity: 1;
			transform: translateX(0);
		}
	}
</style>
