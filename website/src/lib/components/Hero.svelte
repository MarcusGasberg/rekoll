<script lang="ts">
	import { onMount } from 'svelte';
	import { Activity } from 'lucide-svelte';

	let visible = $state(false);
	let displayedText = $state('');

	const phrases = [
		'that video about vector embeddings...',
		'headphones I added to cart on Amazon',
		'the Reddit thread on SvelteKit 5',
		'tweets I liked about LLMs'
	];

	const headingWords = 'Your browsing history, searchable by meaning.'.split(' ');

	onMount(() => {
		setTimeout(() => { visible = true; }, 100);

		let phraseIndex = 0;
		let charIndex = 0;
		let deleting = false;
		let timeout: ReturnType<typeof setTimeout>;

		function tick() {
			const phrase = phrases[phraseIndex];

			if (!deleting) {
				charIndex++;
				displayedText = phrase.slice(0, charIndex);
				if (charIndex === phrase.length) {
					deleting = true;
					timeout = setTimeout(tick, 2000);
					return;
				}
				timeout = setTimeout(tick, 60 + Math.random() * 40);
			} else {
				charIndex--;
				displayedText = phrase.slice(0, charIndex);
				if (charIndex === 0) {
					deleting = false;
					phraseIndex = (phraseIndex + 1) % phrases.length;
					timeout = setTimeout(tick, 500);
					return;
				}
				timeout = setTimeout(tick, 30);
			}
		}

		timeout = setTimeout(tick, 1200);

		return () => clearTimeout(timeout);
	});
</script>

<section class="relative min-h-screen flex items-center justify-center px-6 pt-16">
	<div class="text-center max-w-4xl mx-auto">
		<div
			class="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-neutral-800 bg-neutral-900/50 text-sm text-neutral-500 mb-8 transition-all duration-700 hover:border-neutral-700 hover:bg-neutral-800/50 hover:text-neutral-400 {visible
				? 'opacity-100 translate-y-0'
				: 'opacity-0 translate-y-4'}"
		>
			<Activity class="w-3.5 h-3.5" />
			Local-First Knowledge Engine
		</div>

		<h1 class="text-5xl sm:text-6xl md:text-7xl font-light tracking-tight leading-[1.1] mb-6">
			{#each headingWords as word, i (i)}
				<span
					class="inline-block mr-[0.3em] {visible ? 'animate-word-reveal' : 'opacity-0'}"
					style="animation-delay: {150 + i * 80}ms; animation-fill-mode: both;"
				>
					{word}
				</span>
			{/each}
		</h1>

		<!-- Typing search demo -->
		<div
			class="mx-auto max-w-lg mb-8 transition-all duration-700 delay-700 {visible
				? 'opacity-100 translate-y-0'
				: 'opacity-0 translate-y-4'}"
		>
			<div class="relative group">
				<div class="relative flex items-center px-5 py-3.5 rounded-xl border border-neutral-800 bg-neutral-900/60 h-13 group-hover:border-neutral-700 transition-colors duration-300">
					<svg class="w-4 h-4 text-neutral-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
					</svg>
					<span class="text-neutral-400 text-base sm:text-lg font-light">{displayedText}</span>
					<span
						class="inline-block w-[2px] h-5 bg-neutral-400 ml-0.5"
						style="animation: cursor-blink 1s step-end infinite;"
					></span>
				</div>
			</div>
		</div>

		<p
			class="text-lg sm:text-xl text-neutral-400 max-w-2xl mx-auto transition-all duration-700 delay-500 {visible
				? 'opacity-100 translate-y-0'
				: 'opacity-0 translate-y-4'}"
		>
			Pages, videos, purchases, likes — Rekoll captures it all and makes it
			instantly findable with natural language. On-device ML means your data never
			leaves your machine.
		</p>
	</div>

	<div class="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-neutral-950 to-transparent pointer-events-none"></div>
</section>

<style>
	.animate-word-reveal {
		animation: word-reveal 0.6s cubic-bezier(0.22, 1, 0.36, 1) both;
	}
</style>
