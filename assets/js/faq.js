// FAQ page: open/close questions and the expand-all button.
(() => {
	const items = Array.from(document.querySelectorAll('[data-faq-item]'));
	const expandAll = document.getElementById('faqExpandAll');
	if (!items.length) return;

	const setItemOpen = (item, open) => {
		const button = item.querySelector('.faq-question');
		item.classList.toggle('is-open', open);
		if (button) button.setAttribute('aria-expanded', String(open));
	};

	const updateExpandAll = () => {
		if (!expandAll) return;
		const allOpen = items.every((item) => item.classList.contains('is-open'));
		expandAll.textContent = allOpen ? 'collapse all' : 'expand all';
		expandAll.setAttribute('aria-expanded', String(allOpen));
	};

	items.forEach((item) => {
		const button = item.querySelector('.faq-question');
		if (!button) return;

		item.addEventListener('click', () => {
			const willOpen = !item.classList.contains('is-open');
			setItemOpen(item, willOpen);
			updateExpandAll();
		});
	});

	if (expandAll) {
		expandAll.addEventListener('click', () => {
			const shouldOpen = !items.every((item) => item.classList.contains('is-open'));
			items.forEach((item) => setItemOpen(item, shouldOpen));
			updateExpandAll();
		});
		updateExpandAll();
	}
})();
