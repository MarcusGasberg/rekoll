<script lang="ts">
	import { ChevronRight } from 'lucide-svelte';
</script>

<nav
	class="fixed top-0 left-0 right-0 z-50 border-b border-neutral-800/60 bg-neutral-950/80 backdrop-blur-xl"
>
	<div class="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
		<a href="/" class="flex items-center gap-2.5 text-neutral-50 no-underline">
			<img class="relative flex h-6 w-6 items-center justify-center" src="/rekoll.svg" alt="Rekoll logo" />
			<span class="font-medium text-lg tracking-tight">Rekoll</span>
		</a>

		<div class="hidden sm:flex items-center gap-8">
			<a href="#features" class="text-sm text-neutral-500 hover:text-neutral-200 transition-colors">Features</a>
			<a href="#how-it-works" class="text-sm text-neutral-500 hover:text-neutral-200 transition-colors">How It Works</a>
			<a href="https://github.com/MarcusGasberg/rekoll" class="text-sm text-neutral-500 hover:text-neutral-200 transition-colors">GitHub</a>
			<a
				href="https://github.com/MarcusGasberg/rekoll"
				class="inline-flex items-center gap-1.5 text-sm px-4 py-2 rounded-lg bg-neutral-800 border border-neutral-700 text-white hover:bg-neutral-700 hover:border-neutral-600 font-medium transition-colors"
			>
				Add to Browser
				<ChevronRight class="w-3.5 h-3.5" />
			</a>
		</div>
	</div>
</nav>
