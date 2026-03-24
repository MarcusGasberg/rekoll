<script lang="ts">
	import type { Snippet } from 'svelte';
	import Nav from '$lib/components/Nav.svelte';
	import Footer from '$lib/components/Footer.svelte';

	let { children }: { children: Snippet } = $props();
</script>

<div class="min-h-screen bg-neutral-950 text-neutral-50">
	<Nav />

	<main class="max-w-3xl mx-auto px-6 pt-32 pb-20">
		<div
			class="
				prose prose-invert
				[&_h1]:text-3xl [&_h1]:font-bold [&_h1]:tracking-tight [&_h1]:text-neutral-50 [&_h1]:mb-4
				[&_h2]:text-xl [&_h2]:font-semibold [&_h2]:tracking-tight [&_h2]:text-neutral-100 [&_h2]:mt-10 [&_h2]:mb-3
				[&_h3]:text-lg [&_h3]:font-medium [&_h3]:text-neutral-200 [&_h3]:mt-8 [&_h3]:mb-2
				[&_p]:text-neutral-400 [&_p]:leading-relaxed [&_p]:mb-4
				[&_a]:text-neutral-200 [&_a]:underline [&_a]:underline-offset-2 [&_a]:decoration-neutral-600 hover:[&_a]:text-white hover:[&_a]:decoration-neutral-400 [&_a]:transition-colors
				[&_ul]:list-disc [&_ul]:pl-6 [&_ul]:text-neutral-400 [&_ul]:mb-4 [&_ul]:space-y-1
				[&_ol]:list-decimal [&_ol]:pl-6 [&_ol]:text-neutral-400 [&_ol]:mb-4 [&_ol]:space-y-1
				[&_li]:leading-relaxed
				[&_strong]:text-neutral-200 [&_strong]:font-semibold
			"
		>
			{@render children()}
		</div>
	</main>

	<Footer />
</div>
