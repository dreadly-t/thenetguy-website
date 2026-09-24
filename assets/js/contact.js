// Every page: the quote form, copy-to-clipboard buttons and the CONTACT US button.
// On pages other than home, contact links open the slide-up contact panel (site-navigation.js).
const trackContactEvent = (eventName, parameters) => {
	if (typeof window.trackAnalyticsEvent === 'function') window.trackAnalyticsEvent(eventName, parameters);
};

// Quote form: sends through EmailJS.
(() => {
	const quoteForm = document.getElementById('quoteForm');
	if (!quoteForm) return;

	const quoteSubmit = document.getElementById('quoteSubmit');
	const quoteStatus = document.getElementById('quoteStatus');
	const quoteWebsite = document.getElementById('quoteWebsite');
	const emailServiceId = 'service_8i3sfta';
	const emailTemplateId = 'template_7qurcv6';
	const emailPublicKey = 'Wl1ZvOEmF8vIT4bI7';
	const emailApiUrl = 'https://api.emailjs.com/api/v1.0/email/send-form';
	const submitCooldownMs = 10000;
	let lastSubmitAt = 0;

	const sendQuoteForm = async () => {
		const response = await fetch(emailApiUrl, {
			method: 'POST',
			body: new FormData(quoteForm),
		});
		if (!response.ok) {
			throw new Error(`Email service returned ${response.status}`);
		}
	};

	quoteForm.addEventListener('submit', async (event) => {
		event.preventDefault();

		if (quoteWebsite?.value.trim()) {
			trackContactEvent('quote_submit_spam_blocked');
			return;
		}
		trackContactEvent('quote_submit_attempt');

		const now = Date.now();
		if (now - lastSubmitAt < submitCooldownMs) {
			trackContactEvent('quote_submit_rate_limited');
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
				trackContactEvent('quote_submit_success');
				if (quoteStatus) quoteStatus.textContent = 'Thanks, your enquiry has been sent.';
				quoteForm.reset();
			} else if (quoteStatus) {
				quoteStatus.textContent = 'Email sending is ready to connect once EmailJS IDs are added.';
			}
		} catch (_error) {
			trackContactEvent('quote_submit_error');
			if (quoteStatus) quoteStatus.textContent = 'Something went wrong. Please call or email Tarn directly.';
		} finally {
			if (quoteSubmit) quoteSubmit.disabled = false;
		}
	});

	// Analytics: which fields people start filling in.
	const trackedFields = new Set();
	quoteForm.addEventListener('input', (event) => {
		const field = event.target;
		if (!(field instanceof HTMLInputElement || field instanceof HTMLTextAreaElement)) return;
		if (field.id === 'quoteWebsite' || !field.id || trackedFields.has(field.id)) return;

		if (!trackedFields.size) trackContactEvent('quote_form_started');
		trackedFields.add(field.id);
		const fieldName = field.id.replace(/^quote/, '').toLowerCase();
		trackContactEvent(`quote_field_${fieldName}`);
	});
})();

// Copy buttons next to the phone number and email address.
(() => {
	const copyButtons = Array.from(document.querySelectorAll('.copy-trigger'));
	if (!copyButtons.length) return;

	const fallbackCopy = (text, button) => {
		const tempInput = document.createElement('textarea');
		tempInput.value = text;
		tempInput.setAttribute('readonly', '');
		tempInput.style.position = 'absolute';
		tempInput.style.left = '-9999px';
		// Inside the open panel, only the panel can take focus, so the textarea goes there.
		(button.closest('dialog') || document.body).appendChild(tempInput);
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
			if (button.dataset.copyKind) trackContactEvent(`contact_copy_${button.dataset.copyKind}`);

			try {
				if (navigator.clipboard?.writeText) {
					await navigator.clipboard.writeText(text);
				} else {
					fallbackCopy(text, button);
				}
				if (icon) icon.textContent = 'check';
			} catch (_error) {
				if (icon) icon.textContent = 'error';
			}
			window.setTimeout(() => {
				if (icon) icon.textContent = defaultIcon;
			}, 1400);
		});
	});
})();

// CONTACT US button: shows at the same point as the back-to-top arrow, on every page.
(() => {
	const button = document.querySelector('[data-contact-open]');
	if (!button) return;

	// On home, the contact section is on the page: hide the button while it's on screen.
	const section = document.getElementById('contact');
	const pageSection = section && !section.closest('dialog') ? section : null;

	let frame = null;
	const update = () => {
		frame = null;
		const bounds = pageSection?.getBoundingClientRect();
		const sectionInView = bounds ? bounds.top < window.innerHeight && bounds.bottom > 0 : false;
		button.classList.toggle('is-visible', window.scrollY > window.innerHeight * 0.8 && !sectionInView);
	};
	window.addEventListener('scroll', () => {
		if (frame === null) frame = window.requestAnimationFrame(update);
	}, { passive: true });
	window.addEventListener('resize', () => {
		if (frame === null) frame = window.requestAnimationFrame(update);
	}, { passive: true });
	update();
})();
