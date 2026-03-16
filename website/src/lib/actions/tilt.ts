export function tilt(node: HTMLElement, options?: { max?: number; scale?: number }) {
	const max = options?.max ?? 8;
	const scale = options?.scale ?? 1.02;

	let glare: HTMLDivElement | null = null;

	// Create glare overlay
	glare = document.createElement('div');
	glare.style.cssText = `
		position: absolute;
		inset: 0;
		border-radius: inherit;
		pointer-events: none;
		opacity: 0;
		transition: opacity 0.3s;
		background: radial-gradient(
			circle at var(--glare-x, 50%) var(--glare-y, 50%),
			rgba(255,255,255,0.12) 0%,
			transparent 60%
		);
	`;
	node.style.position = 'relative';
	node.style.overflow = 'hidden';
	node.appendChild(glare);

	function handleMouseMove(e: MouseEvent) {
		const rect = node.getBoundingClientRect();
		const x = (e.clientX - rect.left) / rect.width;
		const y = (e.clientY - rect.top) / rect.height;

		const rotateX = (0.5 - y) * max;
		const rotateY = (x - 0.5) * max;

		node.style.transform = `perspective(800px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(${scale}, ${scale}, ${scale})`;

		if (glare) {
			glare.style.setProperty('--glare-x', `${x * 100}%`);
			glare.style.setProperty('--glare-y', `${y * 100}%`);
			glare.style.opacity = '1';
		}
	}

	function handleMouseLeave() {
		node.style.transform = 'perspective(800px) rotateX(0deg) rotateY(0deg) scale3d(1,1,1)';
		if (glare) glare.style.opacity = '0';
	}

	node.style.transition = 'transform 0.2s ease-out';
	node.addEventListener('mousemove', handleMouseMove);
	node.addEventListener('mouseleave', handleMouseLeave);

	return {
		destroy() {
			node.removeEventListener('mousemove', handleMouseMove);
			node.removeEventListener('mouseleave', handleMouseLeave);
			if (glare) glare.remove();
		}
	};
}
