// Home page: section analytics, hero slideshow and smooth scrolling to sections.
// The price estimator is in estimator.js and the quote form in contact.js.
(() => {
	const trackedOnce = new Set();
	const trackOnce = (eventName, parameters = {}) => {
		if (trackedOnce.has(eventName)) return;
		trackedOnce.add(eventName);
		window.trackAnalyticsEvent(eventName, parameters);
	};

	const sectionObserver = new IntersectionObserver(
		(entries, observer) => {
			entries.forEach((entry) => {
				if (!entry.isIntersecting) return;
				const sectionName = entry.target.id;
				trackOnce(`section_view_${sectionName}`);
				observer.unobserve(entry.target);
			});
		},
		{ rootMargin: '0px 0px -35% 0px', threshold: 0 }
	);

	document
		.querySelectorAll('#hero, #mission, #about, #services, #estimator, #contact')
		.forEach((section) => sectionObserver.observe(section));
})();

(() => {
	const slides = Array.from(document.querySelectorAll('.hero-slide'));
	const dots = Array.from(document.querySelectorAll('.hero-dot'));
	if (!slides.length || slides.length !== dots.length) return;

	const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
	let currentIndex = 0;
	let intervalId = null;

	const loadSlide = (slide) => {
		if (!slide || slide.dataset.loaded === 'true') return Promise.resolve();
		slide.querySelectorAll('source[data-srcset]').forEach((source) => {
			source.srcset = source.dataset.srcset;
			source.removeAttribute('data-srcset');
		});
		const image = slide.querySelector('img[data-src]');
		if (image) {
			const ready = new Promise((resolve) => {
				image.addEventListener('load', resolve, { once: true });
				image.addEventListener('error', resolve, { once: true });
			});
			if (image.dataset.srcset) image.srcset = image.dataset.srcset;
			image.src = image.dataset.src;
			image.removeAttribute('data-src');
			image.removeAttribute('data-srcset');
			slide.dataset.loaded = 'true';
			return ready.then(() => image.decode?.().catch(() => {}));
		}
		slide.dataset.loaded = 'true';
		return Promise.resolve();
	};

	const showSlide = async (index) => {
		await loadSlide(slides[index]);
		slides[currentIndex].classList.remove('is-active');
		dots[currentIndex].classList.remove('is-active');
		currentIndex = index;
		slides[currentIndex].classList.add('is-active');
		dots[currentIndex].classList.add('is-active');
	};

	const startAutoplay = () => {
		if (reducedMotion) return;
		intervalId = window.setInterval(() => {
			showSlide((currentIndex + 1) % slides.length);
		}, 10000);
	};

	const resetAutoplay = () => {
		if (intervalId) window.clearInterval(intervalId);
		startAutoplay();
	};

	dots.forEach((dot, index) => {
		dot.addEventListener('click', () => {
			if (index === currentIndex) return;
			showSlide(index);
			resetAutoplay();
		});
	});

	slides[0].dataset.loaded = 'true';
	startAutoplay();
})();

(() => {
	const headerOffset = 96;
	const shareableHashes = new Set(['#estimator', '#contact']);
	const cleanHomeUrl = '/';
	const cleanScrollStorageKey = 'theNetGuyScrollTarget';
	const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
	const anchorLinks = Array.from(document.querySelectorAll('a[href^="#"], a[href^="/#"]')).filter(
		(link) => !link.closest('[data-site-header]')
	);

	const setUrlForHash = (hash) => {
		const nextUrl = shareableHashes.has(hash) ? hash : cleanHomeUrl;
		try {
			if (shareableHashes.has(hash)) {
				history.pushState(null, '', nextUrl);
			} else {
				history.replaceState(null, '', nextUrl);
			}
		} catch (error) {
			if (shareableHashes.has(hash)) {
				history.pushState(null, '', hash);
			} else {
				history.replaceState(null, '', '#');
			}
		}
	};

	const scrollToHash = (hash, updateHistory = true) => {
		if (!hash || hash === '#' || hash === '#top') {
			window.scrollTo({
				top: 0,
				behavior: prefersReducedMotion ? 'auto' : 'smooth',
			});
			if (updateHistory) setUrlForHash('#top');
			return;
		}

		const target = document.querySelector(hash);
		if (!target) return;

		const targetTop = target.getBoundingClientRect().top + window.scrollY - headerOffset;
		window.scrollTo({
			top: Math.max(targetTop, 0),
			behavior: prefersReducedMotion ? 'auto' : 'smooth',
		});

		if (updateHistory) setUrlForHash(hash);
	};

	anchorLinks.forEach((link) => {
		link.addEventListener('click', (event) => {
			const { hash } = link;
			if (!hash) return;

			const target = hash === '#' ? document.body : document.querySelector(hash);
			if (!target) return;

			event.preventDefault();
			scrollToHash(hash);
		});
	});

	if (window.location.hash) {
		window.setTimeout(() => {
			const hash = window.location.hash;
			scrollToHash(hash, false);
			if (!shareableHashes.has(hash)) {
				try {
					history.replaceState(null, '', cleanHomeUrl);
				} catch (error) {
					history.replaceState(null, '', '#');
				}
			}
		}, 0);
		return;
	}

	const storedTarget = sessionStorage.getItem(cleanScrollStorageKey);
	if (storedTarget) {
		sessionStorage.removeItem(cleanScrollStorageKey);
		window.scrollTo({ top: 0, behavior: 'auto' });
		window.requestAnimationFrame(() => {
			window.requestAnimationFrame(() => {
				scrollToHash(`#${storedTarget}`, false);
				try {
					history.replaceState(null, '', cleanHomeUrl);
				} catch (error) {
					history.replaceState(null, '', '#');
				}
			});
		});
	}
})();
