<script lang="ts">
	import StarBackground from '$lib/components/StarBackground.svelte';
	import Nav from '$lib/components/Nav.svelte';
	import Hero from '$lib/components/Hero.svelte';
	import Stats from '$lib/components/Stats.svelte';
	import BentoGrid from '$lib/components/BentoGrid.svelte';
	import AppMockup from '$lib/components/AppMockup.svelte';
	import Footer from '$lib/components/Footer.svelte';
</script>

<svelte:head>
	<title>Rekoll — Local-First Knowledge Engine</title>
	<link rel="preconnect" href="https://fonts.googleapis.com" />
	<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="anonymous" />
	<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
</svelte:head>

<StarBackground />
<Nav />

<main class="relative z-10">
	<Hero />
	<Stats />
	<BentoGrid />
	<AppMockup />
	<Footer />
</main>
