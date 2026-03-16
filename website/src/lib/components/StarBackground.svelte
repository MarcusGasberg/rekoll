<script lang="ts">
	import { onMount } from 'svelte';

	let canvas: HTMLCanvasElement;

	onMount(() => {
		const ctx = canvas.getContext('2d')!;
		let animationId: number;
		let stars: { x: number; y: number; size: number; opacity: number; speed: number }[] = [];

		function resize() {
			canvas.width = window.innerWidth;
			canvas.height = window.innerHeight;
			initStars();
		}

		function initStars() {
			const count = Math.floor((canvas.width * canvas.height) / 8000);
			stars = Array.from({ length: count }, () => ({
				x: Math.random() * canvas.width,
				y: Math.random() * canvas.height,
				size: Math.random() * 1.5 + 0.5,
				opacity: Math.random() * 0.7 + 0.1,
				speed: Math.random() * 0.3 + 0.05
			}));
		}

		function draw() {
			ctx.clearRect(0, 0, canvas.width, canvas.height);
			const time = Date.now() * 0.001;

			for (const star of stars) {
				const flicker = Math.sin(time * star.speed * 2 + star.x) * 0.3 + 0.7;
				ctx.beginPath();
				ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
				ctx.fillStyle = `rgba(255, 255, 255, ${star.opacity * flicker})`;
				ctx.fill();
			}

			animationId = requestAnimationFrame(draw);
		}

		resize();
		draw();
		window.addEventListener('resize', resize);

		return () => {
			cancelAnimationFrame(animationId);
			window.removeEventListener('resize', resize);
		};
	});
</script>

<canvas
	bind:this={canvas}
	class="fixed inset-0 pointer-events-none"
	style="z-index: 0;"
></canvas>
