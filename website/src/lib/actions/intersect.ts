export function intersect(
	node: HTMLElement,
	options?: { threshold?: number; once?: boolean; onIntersect?: () => void }
) {
	const threshold = options?.threshold ?? 0.2;
	const once = options?.once ?? true;
	const callback = options?.onIntersect;

	const observer = new IntersectionObserver(
		(entries) => {
			for (const entry of entries) {
				if (entry.isIntersecting) {
					node.classList.add('in-view');
					callback?.();
					if (once) observer.unobserve(node);
				} else if (!once) {
					node.classList.remove('in-view');
				}
			}
		},
		{ threshold }
	);

	observer.observe(node);

	return {
		destroy() {
			observer.disconnect();
		}
	};
}
