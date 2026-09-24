(() => {
	const header = document.querySelector('[data-site-header]');
	if (!header) return;

	const directory = header.querySelector('[data-site-directory]');
	const directoryToggle = header.querySelector('[data-directory-toggle]');
	const directoryPanel = header.querySelector('[data-directory-panel]');
	const mobileToggle = header.querySelector('[data-mobile-menu-toggle]');
	const mobileMenu = header.querySelector('[data-mobile-menu]');
	const mobileBackdrop = header.querySelector('[data-menu-backdrop]');
	const pageContent = document.getElementById('main-content');
	const pageFooter = document.querySelector('footer');
	const sectionLinks = Array.from(header.querySelectorAll('[data-nav-section]'));
	const navigationLinks = Array.from(header.querySelectorAll('a[href]'));
	const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
	const desktopQuery = window.matchMedia('(min-width: 1024px)');
	let mobileMenuOpen = false;
	let scrollFrame = null;

	const normalisePath = (path) => {
		if (!path || path === '/') return '/';
		const cleanPath = `/${path.replace(/^\/+|\/+$/g, '')}`.replace(/\/index\.html$/i, '');
		return cleanPath === '' ? '/' : `${cleanPath}/`;
	};

	const currentPath = normalisePath(window.location.pathname);
	const parentPathByChild = {
		'/palmerston-north/': '/manawatu-whanganui/',
		'/feilding-manawatu/': '/manawatu-whanganui/',
		'/levin-horowhenua/': '/manawatu-whanganui/',
		'/tararua/': '/manawatu-whanganui/',
	};

	const setHeaderState = () => {
		header.classList.toggle('is-scrolled', window.scrollY > 24);
	};

	const closeDirectory = (restoreFocus = false) => {
		if (!directoryToggle || !directoryPanel || directoryPanel.hidden) return;
		directoryToggle.setAttribute('aria-expanded', 'false');
		directoryPanel.classList.remove('is-open');
		directoryPanel.hidden = true;
		header.classList.remove('has-open-navigation');
		if (restoreFocus) directoryToggle.focus();
	};

	const openDirectory = () => {
		if (!directoryToggle || !directoryPanel) return;
		directoryPanel.hidden = false;
		directoryToggle.setAttribute('aria-expanded', 'true');
		directoryPanel.classList.add('is-open');
		header.classList.add('has-open-navigation');
	};

	const setPageInert = (inert) => {
		[pageContent, pageFooter].forEach((element) => {
			if (!element) return;
			element.inert = inert;
		});
	};

	const closeMobileMenu = (restoreFocus = false) => {
		if (!mobileToggle || !mobileMenu || !mobileMenuOpen) return;
		mobileMenuOpen = false;
		mobileToggle.setAttribute('aria-expanded', 'false');
		mobileToggle.setAttribute('aria-label', 'Open main menu');
		mobileMenu.setAttribute('aria-hidden', 'true');
		mobileMenu.classList.remove('is-open');
		mobileMenu.hidden = true;
		if (mobileBackdrop) mobileBackdrop.hidden = true;
		document.body.classList.remove('site-mobile-menu-open');
		header.classList.remove('has-open-navigation');
		setPageInert(false);
		if (restoreFocus) mobileToggle.focus();
	};

	const openMobileMenu = () => {
		if (!mobileToggle || !mobileMenu) return;
		closeDirectory();
		mobileMenuOpen = true;
		mobileMenu.hidden = false;
		if (mobileBackdrop) mobileBackdrop.hidden = false;
		mobileToggle.setAttribute('aria-expanded', 'true');
		mobileToggle.setAttribute('aria-label', 'Close main menu');
		mobileMenu.setAttribute('aria-hidden', 'false');
		mobileMenu.classList.add('is-open');
		document.body.classList.add('site-mobile-menu-open');
		header.classList.add('has-open-navigation');
		setPageInert(true);
		const firstLink = mobileMenu.querySelector('a[href]');
		window.requestAnimationFrame(() => firstLink?.focus());
	};

	const getMobileFocusables = () => {
		return Array.from(
			header.querySelectorAll(
				'.site-header__brand, .site-header__mobile-quote, [data-mobile-menu-toggle], [data-mobile-menu] a[href]'
			)
		).filter((element) => !element.closest('[hidden]'));
	};

	const updateCurrentPage = () => {
		let secondaryPageActive = false;
		const highlightedPath = parentPathByChild[currentPath] || currentPath;

		header.querySelectorAll('[data-nav-path]').forEach((link) => {
			const linkPath = normalisePath(link.getAttribute('data-nav-path'));
			const active = currentPath !== '/' && linkPath === highlightedPath;
			link.classList.toggle('is-active', active);
			if (active) {
				link.setAttribute('aria-current', linkPath === currentPath ? 'page' : 'location');
				if (link.closest('[data-site-directory]')) secondaryPageActive = true;
			} else {
				link.removeAttribute('aria-current');
			}
		});

		if (directoryToggle) {
			directoryToggle.classList.toggle('is-active', secondaryPageActive);
		}
	};

	const updateCurrentSection = () => {
		if (currentPath !== '/') return;
		const headerHeight = header.getBoundingClientRect().height;
		const marker = headerHeight + Math.min(window.innerHeight * 0.18, 150);
		let activeSection = '';

		sectionLinks.forEach((link) => {
			const sectionId = link.getAttribute('data-nav-section');
			const section = sectionId ? document.getElementById(sectionId) : null;
			if (!section) return;
			const bounds = section.getBoundingClientRect();
			if (bounds.top <= marker && bounds.bottom > marker) activeSection = sectionId;
		});

		sectionLinks.forEach((link) => {
			const active = link.getAttribute('data-nav-section') === activeSection;
			link.classList.toggle('is-active', active);
			if (active) {
				link.setAttribute('aria-current', 'location');
			} else {
				link.removeAttribute('aria-current');
			}
		});
	};

	const handleScroll = () => {
		if (scrollFrame !== null) return;
		scrollFrame = window.requestAnimationFrame(() => {
			setHeaderState();
			updateCurrentSection();
			scrollFrame = null;
		});
	};

	directoryToggle?.addEventListener('click', () => {
		if (directoryToggle.getAttribute('aria-expanded') === 'true') {
			closeDirectory();
		} else {
			openDirectory();
		}
	});

	mobileToggle?.addEventListener('click', () => {
		if (mobileMenuOpen) {
			closeMobileMenu(true);
		} else {
			openMobileMenu();
		}
	});

	mobileBackdrop?.addEventListener('click', () => closeMobileMenu(true));

	navigationLinks.forEach((link) => {
		link.addEventListener('click', (event) => {
			const label = link.textContent.trim().replace(/\s+/g, ' ').toLowerCase();
			if (typeof window.trackAnalyticsEvent === 'function') {
				window.trackAnalyticsEvent('navigation_click', {
					navigation_label: label,
					navigation_location: link.closest('[data-mobile-menu]') ? 'mobile_menu' : 'header',
					transport_type: 'beacon',
				});
			}

			const url = new URL(link.href, window.location.href);
			const isHomeSection = currentPath === '/' && url.pathname === '/' && url.hash;
			if (isHomeSection) {
				const target = document.querySelector(url.hash);
				if (target) {
					event.preventDefault();
					closeDirectory();
					closeMobileMenu(true);
					const offset = header.getBoundingClientRect().height + 16;
					const top = Math.max(target.getBoundingClientRect().top + window.scrollY - offset, 0);
					window.scrollTo({
						top,
						behavior: reducedMotion ? 'auto' : 'smooth',
					});
					if (url.hash === '#estimator' || url.hash === '#contact') {
						history.pushState(null, '', url.hash);
					} else {
						history.replaceState(null, '', '/');
					}
				}
				return;
			}

			const isHomeBrand = currentPath === '/' && url.pathname === '/' && !url.hash && link.classList.contains('site-header__brand');
			if (isHomeBrand) {
				event.preventDefault();
				closeDirectory();
				closeMobileMenu(true);
				window.scrollTo({ top: 0, behavior: reducedMotion ? 'auto' : 'smooth' });
				history.replaceState(null, '', '/');
				return;
			}

			closeDirectory();
			closeMobileMenu(false);
		});
	});

	document.addEventListener('pointerdown', (event) => {
		if (directory && !directory.contains(event.target)) closeDirectory();
	});

	document.addEventListener('focusin', (event) => {
		if (!mobileMenuOpen && directory && !directory.contains(event.target)) closeDirectory();
	});

	document.addEventListener('keydown', (event) => {
		if (event.key === 'Escape') {
			if (mobileMenuOpen) {
				event.preventDefault();
				closeMobileMenu(true);
			} else if (directoryToggle?.getAttribute('aria-expanded') === 'true') {
				event.preventDefault();
				closeDirectory(true);
			}
			return;
		}

		if (event.key !== 'Tab' || !mobileMenuOpen) return;
		const focusables = getMobileFocusables();
		if (!focusables.length) return;
		const first = focusables[0];
		const last = focusables[focusables.length - 1];

		if (event.shiftKey && document.activeElement === first) {
			event.preventDefault();
			last.focus();
		} else if (!event.shiftKey && document.activeElement === last) {
			event.preventDefault();
			first.focus();
		}
	});

	const handleViewportChange = () => {
		if (desktopQuery.matches) closeMobileMenu(false);
		closeDirectory();
		setHeaderState();
		updateCurrentSection();
	};

	if (typeof desktopQuery.addEventListener === 'function') {
		desktopQuery.addEventListener('change', handleViewportChange);
	} else {
		desktopQuery.addListener(handleViewportChange);
	}

	window.addEventListener('scroll', handleScroll, { passive: true });
	window.addEventListener('resize', handleScroll, { passive: true });
	window.addEventListener('popstate', updateCurrentSection);

	updateCurrentPage();
	setHeaderState();
	updateCurrentSection();
})();

// Icons are decorative; hide them from screen readers on every page.
document.querySelectorAll('.material-symbols-outlined').forEach((icon) => {
	icon.setAttribute('aria-hidden', 'true');
});

// From other pages, links to a home-page section (e.g. /#estimator) open the home page with a clean URL.
// The home page reads the stored target and scrolls to it.
(() => {
	if (window.location.pathname === '/' || window.location.pathname === '/index.html') return;

	document.querySelectorAll('a[href^="/#"]').forEach((link) => {
		link.addEventListener('click', (event) => {
			if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

			const target = new URL(link.href).hash.slice(1);
			if (!target) return;
			// Contact and pricing links open their pop-up panel instead (below).
			if (document.querySelector(`[data-${target}-panel]`)) return;

			try {
				sessionStorage.setItem('theNetGuyScrollTarget', target);
				event.preventDefault();
				window.location.assign('/');
			} catch (error) {
				// Keep the direct hash link as the fallback when storage is unavailable.
			}
		});
	});
})();

// Pop-up panels: the quote form slides up from the bottom, the price estimator drops down from the top
// (the direction is set in the CSS). Only pages other than home have them (npm run sync adds them);
// on home, these links scroll to the section instead (home.js).
(() => {
	const panels = [
		{ name: 'contact', panel: document.querySelector('[data-contact-panel]'), links: '[data-contact-open], a[href="/#contact"]' },
		{ name: 'estimator', panel: document.querySelector('[data-estimator-panel]'), links: 'a[href="/#estimator"]' },
	].filter(({ panel }) => panel && typeof panel.showModal === 'function');
	if (!panels.length) return;

	const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
	const contactButton = document.querySelector('[data-contact-open]');
	const openers = new Map();

	const closePanel = (panel) => {
		if (!panel.open || !panel.classList.contains('is-open')) return;
		panel.classList.remove('is-open');
		const finish = () => {
			panel.close();
			// "Enquire now" in the estimator opens the contact panel as this one leaves.
			if (panels.some((other) => other.panel.open)) return;
			document.body.classList.remove('popup-panel-open');
			openers.get(panel)?.focus({ preventScroll: true });
		};
		if (reducedMotion) {
			finish();
			return;
		}
		// Close once the slide ends (with a fallback in case the transition doesn't run).
		let fallback = null;
		const onEnd = (event) => {
			if (event.target === panel) done();
		};
		const done = () => {
			window.clearTimeout(fallback);
			panel.removeEventListener('transitionend', onEnd);
			finish();
		};
		fallback = window.setTimeout(done, 600);
		panel.addEventListener('transitionend', onEnd);
	};

	const openPanel = ({ name, panel }, link) => {
		if (panel.open) return;
		// Opened from inside another panel: close that one, and hand focus back to what opened it.
		const fromPanel = link.closest('dialog');
		openers.set(panel, fromPanel ? openers.get(fromPanel) : link);
		panels.forEach((other) => closePanel(other.panel));
		panel.showModal();
		panel.scrollTop = 0;
		document.body.classList.add('popup-panel-open');
		// Wait a frame so the panel starts off screen, then slide it in.
		window.requestAnimationFrame(() => {
			window.requestAnimationFrame(() => panel.classList.add('is-open'));
		});
		if (typeof window.trackAnalyticsEvent === 'function') {
			window.trackAnalyticsEvent(`${name}_panel_open`, {
				[`${name}_source`]: link.dataset.analyticsSource || (link === contactButton ? 'contact_button' : 'page_link'),
			});
		}
	};

	panels.forEach((entry) => {
		const { panel, links } = entry;

		document.querySelectorAll(links).forEach((link) => {
			link.addEventListener('click', (event) => {
				if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
				event.preventDefault();
				// Let the mobile menu close first (the header code above handles that on the same click).
				window.requestAnimationFrame(() => openPanel(entry, link));
			});
		});

		panel.querySelector('[data-panel-close]')?.addEventListener('click', () => closePanel(panel));

		// Clicks on the dark area outside the panel land on the dialog itself.
		panel.addEventListener('click', (event) => {
			if (event.target === panel) closePanel(panel);
		});

		// Escape: slide away instead of vanishing.
		panel.addEventListener('cancel', (event) => {
			event.preventDefault();
			closePanel(panel);
		});
	});
})();

// Back-to-top arrow: shows once the first screen has scrolled away, then scrolls smoothly to the top.
(() => {
	const button = document.querySelector('[data-back-to-top]');
	if (!button) return;

	const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
	let frame = null;

	const update = () => {
		frame = null;
		button.classList.toggle('is-visible', window.scrollY > window.innerHeight * 0.8);
	};

	window.addEventListener('scroll', () => {
		if (frame === null) frame = window.requestAnimationFrame(update);
	}, { passive: true });
	update();

	button.addEventListener('click', (event) => {
		event.preventDefault();
		window.scrollTo({ top: 0, behavior: reducedMotion ? 'auto' : 'smooth' });
		// Send keyboard focus back to the top too, without jumping the scroll.
		document.getElementById('main-content')?.focus({ preventScroll: true });
	});
})();

// Count-up numbers: any element with data-count-to="1000" counts up from 0 the first time it scrolls into view.
// Optional data-count-prefix="~" / data-count-suffix="%" keep a symbol before or after the number while it counts.
// The real number stays in the HTML, so search engines and no-JS visitors still see it.
(() => {
	const numbers = Array.from(document.querySelectorAll('[data-count-to]'));
	if (!numbers.length || !('IntersectionObserver' in window)) return;
	if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

	const duration = 1600;
	const format = (element, value) => `${element.dataset.countPrefix || ''}${value.toLocaleString('en-NZ')}${element.dataset.countSuffix || ''}`;
	const easeOut = (t) => 1 - Math.pow(1 - t, 3);

	const run = (element) => {
		const target = Number(element.dataset.countTo);
		const start = performance.now();
		const step = (now) => {
			const progress = Math.min((now - start) / duration, 1);
			element.textContent = format(element, Math.round(target * easeOut(progress)));
			if (progress < 1) window.requestAnimationFrame(step);
		};
		window.requestAnimationFrame(step);
	};

	const observer = new IntersectionObserver((entries) => {
		entries.forEach((entry) => {
			if (!entry.isIntersecting) return;
			observer.unobserve(entry.target);
			run(entry.target);
		});
	}, { threshold: 0.6 });

	numbers.forEach((element) => {
		// Only reset numbers that are still below the screen, so nothing visible flickers to 0.
		if (element.getBoundingClientRect().top > window.innerHeight) element.textContent = format(element, 0);
		observer.observe(element);
	});
})();
