<script lang="ts">
	import { intersect } from '$lib/actions/intersect';

	let visible = $state(false);
	let selectedIndex = $state(0);

	const filters = ['All', 'Page Visit', 'Video', 'Purchase', 'Like'];
	let activeFilter = $state('All');

	const mockEvents = [
		{
			title: 'Understanding Vector Embeddings — 3Blue1Brown',
			domain: 'youtube.com',
			type: 'video_watch',
			time: '2m ago',
			score: 96,
			meta: 'Duration: 18:24 · Channel: 3Blue1Brown'
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
			title: 'SvelteKit 5 migration guide — megathread',
			domain: 'reddit.com',
			type: 'page_visit',
			time: '1h ago',
			score: 88,
			meta: 'Subreddit: r/sveltejs · 342 upvotes'
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
			title: 'How to Build a Semantic Search Engine',
			domain: 'blog.example.com',
			type: 'page_visit',
			time: '3h ago',
			score: 79,
			meta: 'Reading time: 8 min · Category: Engineering'
		},
		{
			title: 'ONNX Runtime WebAssembly Performance',
			domain: 'onnxruntime.ai',
			type: 'page_visit',
			time: '5h ago',
			score: 73,
			meta: 'Section: Documentation · Last updated: 2 days ago'
		}
	];

	const typeColors: Record<string, string> = {
		video_watch: 'border-blue-800/60 text-blue-400',
		purchase: 'border-green-800/60 text-green-400',
		page_visit: 'border-neutral-700 text-neutral-300',
		like: 'border-pink-800/60 text-pink-400'
	};

	function filterLabel(type: string) {
		return type.replace('_', ' ').replace(/\b\w/g, (c) => c.toUpperCase());
	}
</script>

<section
	id="how-it-works"
	class="relative py-24 px-6"
	use:intersect={{ threshold: 0.1, onIntersect: () => { visible = true; } }}
>
	<div class="max-w-5xl mx-auto">
		<div class="text-center mb-12">
			<h2 class="text-3xl sm:text-4xl font-light tracking-tight mb-4 text-white">
				See it in action
			</h2>
			<p class="text-neutral-400 text-lg max-w-2xl mx-auto">
				A clean, focused interface that surfaces the right results instantly.
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
				<span class="ml-4 text-xs text-neutral-600">Rekoll — Browsing Events</span>
			</div>

			<div class="flex flex-col md:flex-row min-h-[420px]">
				<!-- Left sidebar -->
				<div class="w-full md:w-64 border-b md:border-b-0 md:border-r border-neutral-800 flex flex-col">
					<!-- Search bar -->
					<div class="px-3 py-2.5 border-b border-neutral-800">
						<div class="px-3 py-1.5 rounded-lg bg-neutral-950 border border-neutral-800 text-xs text-neutral-600">
							Search by meaning...
						</div>
					</div>

					<!-- Filter pills -->
					<div class="px-3 py-2 border-b border-neutral-800 flex gap-1.5 flex-wrap">
						{#each filters as filter (filter)}
							<button
								class="text-[10px] px-2.5 py-0.5 rounded-full border transition-colors cursor-default {activeFilter === filter
									? 'bg-neutral-700/60 text-white border-neutral-700'
									: 'border-neutral-800 text-neutral-500'}"
								onclick={() => { activeFilter = filter; }}
							>
								{filter}
							</button>
						{/each}
					</div>

					<!-- Event list -->
					<div class="relative flex-1 overflow-hidden">
						<div class="p-2 flex flex-col gap-1">
							{#each mockEvents as event, i (event.title)}
								<button
									class="w-full text-left rounded-lg p-2.5 transition-all duration-300 cursor-default {selectedIndex === i
										? 'bg-neutral-800/80 border border-neutral-700'
										: 'border border-transparent hover:bg-neutral-800/40'} {visible
										? 'opacity-100 translate-x-0'
										: 'opacity-0 -translate-x-4'}"
									style="transition-delay: {300 + i * 100}ms"
									onclick={() => { selectedIndex = i; }}
								>
									<div class="text-xs font-medium text-neutral-200 truncate mb-1">{event.title}</div>
									<div class="flex items-center gap-1.5">
										<span class="text-[10px] text-neutral-600">{event.domain}</span>
										<span class="text-[10px] px-1.5 py-0.5 rounded border uppercase font-semibold tracking-wider {typeColors[event.type] ?? 'border-neutral-700 text-neutral-300'}">{filterLabel(event.type)}</span>
									</div>
								</button>
							{/each}
						</div>
						<!-- Progressive blur at bottom -->
						<div class="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-neutral-900/80 to-transparent pointer-events-none"></div>
					</div>
				</div>

				<!-- Right content pane -->
				<div class="flex-1 p-6">
					{#each [mockEvents[selectedIndex]] as selected (selected.title)}
						<div class="mb-6">
							<h3 class="text-base font-medium text-neutral-200 mb-2">{selected.title}</h3>
							<div class="flex items-center gap-2 flex-wrap">
								<span class="text-[11px] px-2 py-0.5 rounded bg-neutral-800 border border-neutral-800 text-neutral-500">{selected.domain}</span>
								<span class="text-[11px] px-2 py-0.5 rounded border uppercase font-semibold tracking-wider {typeColors[selected.type] ?? 'border-neutral-700 text-neutral-300'}">{filterLabel(selected.type)}</span>
								<span class="text-[11px] px-2 py-0.5 rounded bg-neutral-800/50 text-neutral-300 font-medium">{selected.score}% match</span>
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
						<div class="mt-8 px-3 py-2 rounded-lg border border-neutral-800 bg-neutral-900/40">
							<div class="text-[10px] text-neutral-600 uppercase tracking-wider mb-1">Embedding Preview</div>
							<div class="text-[11px] text-neutral-500 font-mono truncate">
								[0.0234, -0.1892, 0.4521, 0.0087, -0.3341, 0.2198, ...]
							</div>
						</div>
					{/each}
				</div>
			</div>
		</div>
	</div>
</section>
