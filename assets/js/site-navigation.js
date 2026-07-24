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
