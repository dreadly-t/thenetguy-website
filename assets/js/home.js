// Home page: price estimator and quote form, section analytics, hero slideshow,
// smooth scrolling to sections, and copy-to-clipboard buttons.
document.addEventListener('DOMContentLoaded', () => {
	const inputArea = document.getElementById('inputArea');
	const areaDisplay = document.getElementById('areaDisplay');
	const inputWeeks = document.getElementById('inputWeeks');
	const durationDisplay = document.getElementById('durationDisplay');
	const resInstall = document.getElementById('resInstall');
	const resHire = document.getElementById('resHire');
	const resGST = document.getElementById('resGST');
	const resGrandTotal = document.getElementById('resGrandTotal');
	const quoteM2 = document.getElementById('quoteM2');
	const quoteDuration = document.getElementById('quoteDuration');
	const quoteForm = document.getElementById('quoteForm');
	const quoteSubmit = document.getElementById('quoteSubmit');
	const quoteStatus = document.getElementById('quoteStatus');
	const quoteWebsite = document.getElementById('quoteWebsite');
	const emailServiceId = 'service_8i3sfta';
	const emailTemplateId = 'template_7qurcv6';
	const emailPublicKey = 'Wl1ZvOEmF8vIT4bI7';
	const emailApiUrl = 'https://api.emailjs.com/api/v1.0/email/send-form';
	const submitCooldownMs = 10000;
	let lastSubmitAt = 0;
	const trackEvent = (eventName) => {
		if (typeof window.trackAnalyticsEvent === 'function') {
			window.trackAnalyticsEvent(eventName);
		}
	};

	const sendQuoteForm = async () => {
		const response = await fetch(emailApiUrl, {
			method: 'POST',
			body: new FormData(quoteForm),
		});
		if (!response.ok) {
			throw new Error(`Email service returned ${response.status}`);
		}
	};

	const clampValue = (value, min, max) => {
		const number = parseFloat(value);
		if (Number.isNaN(number)) return min;
		return Math.min(Math.max(number, min), max);
	};

	const syncFormToEstimator = () => {
		if (quoteM2) {
			const area = clampValue(quoteM2.value, parseFloat(inputArea.min), parseFloat(inputArea.max));
			quoteM2.value = area;
			inputArea.value = area;
		}
		if (quoteDuration) {
			const weeks = Math.round(clampValue(quoteDuration.value, parseInt(inputWeeks.min), parseInt(inputWeeks.max)));
			quoteDuration.value = weeks;
			inputWeeks.value = weeks;
		}
		calculate();
	};

	function calculate() {
		const area = parseFloat(inputArea.value) || 0;
		const weeks = parseInt(inputWeeks.value);
		areaDisplay.innerText = `${area} m²`;
		durationDisplay.innerText = `${weeks} ${weeks === 1 ? 'Week' : 'Weeks'}`;
		if (quoteM2 && document.activeElement !== quoteM2) quoteM2.value = area;
		if (quoteDuration && document.activeElement !== quoteDuration) quoteDuration.value = weeks;
		const baseInstall = area * 5.0;
		const weeklyHire = baseInstall * 0.1;
		const totalHire = weeklyHire * weeks;
		const totalPreTax = baseInstall + totalHire;
		const gst = totalPreTax * 0.15;
		const grandTotal = totalPreTax + gst;
		const formatter = new Intl.NumberFormat('en-NZ', {
			style: 'currency',
			currency: 'NZD',
		});
		resInstall.innerText = formatter.format(baseInstall);
		resHire.innerText = formatter.format(totalHire);
		resGST.innerText = formatter.format(gst);
		resGrandTotal.innerText = formatter.format(grandTotal);
	}
	inputArea.addEventListener('input', calculate);
	inputWeeks.addEventListener('input', calculate);
	if (quoteM2) {
		quoteM2.addEventListener('change', () => {
			syncFormToEstimator();
		});
	}
	if (quoteDuration) {
		quoteDuration.addEventListener('change', () => {
			syncFormToEstimator();
		});
	}
	if (quoteForm) {
		quoteForm.addEventListener('submit', async (event) => {
			event.preventDefault();
			syncFormToEstimator();

			if (quoteWebsite?.value.trim()) {
				trackEvent('quote_submit_spam_blocked');
				return;
			}
			trackEvent('quote_submit_attempt');

			const now = Date.now();
			if (now - lastSubmitAt < submitCooldownMs) {
				trackEvent('quote_submit_rate_limited');
				if (quoteStatus) quoteStatus.textContent = 'Please wait a moment before sending another enquiry.';
				return;
			}
			lastSubmitAt = now;

			const hasEmailConfig = ![emailServiceId, emailTemplateId, emailPublicKey].some((value) =>
				value.startsWith('YOUR_')
			);

			if (quoteSubmit) quoteSubmit.disabled = true;
			if (quoteStatus) quoteStatus.textContent = 'Sending your enquiry...';

			try {
				if (hasEmailConfig) {
					await sendQuoteForm();
					if (typeof window.gtag === 'function') {
						window.gtag('event', 'generate_lead', {
							lead_source: 'quote_form',
							form_name: 'quote_request',
						});
					}
					trackEvent('quote_submit_success');
					if (quoteStatus) quoteStatus.textContent = 'Thanks, your enquiry has been sent.';
					quoteForm.reset();
					calculate();
				} else if (quoteStatus) {
					quoteStatus.textContent = 'Email sending is ready to connect once EmailJS IDs are added.';
				}
			} catch (_error) {
				trackEvent('quote_submit_error');
				if (quoteStatus) quoteStatus.textContent = 'Something went wrong. Please call or email Tarn directly.';
			} finally {
				if (quoteSubmit) quoteSubmit.disabled = false;
			}
		});
	}
	calculate();
});

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

	const estimatorInputs = {
		inputArea: 'area',
		inputWeeks: 'duration',
	};
	Object.entries(estimatorInputs).forEach(([inputId, inputName]) => {
		const input = document.getElementById(inputId);
		if (!input) return;
		input.addEventListener('input', () => {
			trackOnce('estimator_started');
			trackOnce(`estimator_${inputName}_adjusted`);
		});
	});

	const quoteForm = document.getElementById('quoteForm');
	if (quoteForm) {
		const trackedFields = new Set();
		quoteForm.addEventListener('input', (event) => {
			const field = event.target;
			if (!(field instanceof HTMLInputElement || field instanceof HTMLTextAreaElement)) return;
			if (field.id === 'quoteWebsite' || !field.id || trackedFields.has(field.id)) return;

			trackedFields.add(field.id);
			trackOnce('quote_form_started');
			const fieldName = field.id.replace(/^quote/, '').toLowerCase();
			window.trackAnalyticsEvent(`quote_field_${fieldName}`);
		});
	}

	document.querySelectorAll('.copy-trigger').forEach((button) => {
		button.addEventListener('click', () => {
			const contactKind = button.dataset.copyKind;
			if (contactKind) window.trackAnalyticsEvent(`contact_copy_${contactKind}`);
		});
	});
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
	const anchorLinks = Array.from(document.querySelectorAll('a[href^="#"]')).filter(
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

(() => {
	const copyButtons = Array.from(document.querySelectorAll('.copy-trigger'));
	if (!copyButtons.length) return;

	const fallbackCopy = (text) => {
		const tempInput = document.createElement('textarea');
		tempInput.value = text;
		tempInput.setAttribute('readonly', '');
		tempInput.style.position = 'absolute';
		tempInput.style.left = '-9999px';
		document.body.appendChild(tempInput);
		tempInput.select();
		document.execCommand('copy');
		tempInput.remove();
	};

	copyButtons.forEach((button) => {
		const icon = button.querySelector('.material-symbols-outlined');
		const defaultIcon = button.dataset.copyDefault || 'content_copy';

		button.addEventListener('click', async () => {
			const text = button.dataset.copyText;
			if (!text) return;

			try {
				if (navigator.clipboard?.writeText) {
					await navigator.clipboard.writeText(text);
				} else {
					fallbackCopy(text);
				}
				if (icon) icon.textContent = 'check';
				window.setTimeout(() => {
					if (icon) icon.textContent = defaultIcon;
				}, 1400);
			} catch (_error) {
				if (icon) icon.textContent = 'error';
				window.setTimeout(() => {
					if (icon) icon.textContent = defaultIcon;
				}, 1400);
			}
		});
	});
})();
