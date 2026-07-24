(() => {
	const measurementId = 'G-WB7SWB4SEP';

	window.dataLayer = window.dataLayer || [];
	window.gtag = window.gtag || function gtag() {
		window.dataLayer.push(arguments);
	};
	window.trackAnalyticsEvent = (eventName, parameters = {}) => {
		window.gtag('event', eventName, parameters);
	};

	window.gtag('js', new Date());
	window.gtag('config', measurementId);

	if (!document.querySelector('script[data-analytics-loader]')) {
		const script = document.createElement('script');
		script.async = true;
		script.dataset.analyticsLoader = 'true';
		script.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`;
		document.head.appendChild(script);
	}

	const normaliseEventSegment = (value) => {
		return String(value || 'page')
			.trim()
			.toLowerCase()
			.replace(/[^a-z0-9]+/g, '_')
			.replace(/^_+|_+$/g, '') || 'page';
	};

	document.querySelectorAll('a[href="#contact"], a[href="/#contact"]').forEach((link) => {
		link.addEventListener('click', () => {
			const source = link.dataset.analyticsSource
				|| link.closest('section, header, nav')?.id
				|| (link.closest('nav') ? 'navigation' : 'page');

			window.trackAnalyticsEvent(`quote_cta_${normaliseEventSegment(source)}`, {
				transport_type: 'beacon',
			});
		});
	});

	document.querySelectorAll('a[href^="tel:"]').forEach((link) => {
		link.addEventListener('click', () => {
			window.trackAnalyticsEvent('contact_phone_click', {
				transport_type: 'beacon',
			});
		});
	});
})();
