// Every page: the price estimator, kept in step with the quote form's m² and duration fields.
// On home it's a section on the page; on other pages it's in the drop-down estimator panel.
(() => {
	const inputArea = document.getElementById('inputArea');
	const inputWeeks = document.getElementById('inputWeeks');
	if (!inputArea || !inputWeeks) return;

	// Pricing: installation per m², then weekly hire as a share of the installation (before GST).
	const installPerM2 = 4.0;
	const weeklyHireRate = 0.1;
	const gstRate = 0.15;

	const areaDisplay = document.getElementById('areaDisplay');
	const durationDisplay = document.getElementById('durationDisplay');
	const resInstall = document.getElementById('resInstall');
	const resHire = document.getElementById('resHire');
	const resGST = document.getElementById('resGST');
	const resGrandTotal = document.getElementById('resGrandTotal');
	const quoteM2 = document.getElementById('quoteM2');
	const quoteDuration = document.getElementById('quoteDuration');
	const quoteForm = document.getElementById('quoteForm');
	const formatter = new Intl.NumberFormat('en-NZ', {
		style: 'currency',
		currency: 'NZD',
	});

	const clampValue = (value, min, max) => {
		const number = parseFloat(value);
		if (Number.isNaN(number)) return min;
		return Math.min(Math.max(number, min), max);
	};

	const calculate = () => {
		const area = parseFloat(inputArea.value) || 0;
		const weeks = parseInt(inputWeeks.value);
		areaDisplay.innerText = `${area} m²`;
		durationDisplay.innerText = `${weeks} ${weeks === 1 ? 'Week' : 'Weeks'}`;
		if (quoteM2 && document.activeElement !== quoteM2) quoteM2.value = area;
		if (quoteDuration && document.activeElement !== quoteDuration) quoteDuration.value = weeks;
		const baseInstall = area * installPerM2;
		const totalHire = baseInstall * weeklyHireRate * weeks;
		const totalPreTax = baseInstall + totalHire;
		const gst = totalPreTax * gstRate;
		resInstall.innerText = formatter.format(baseInstall);
		resHire.innerText = formatter.format(totalHire);
		resGST.innerText = formatter.format(gst);
		resGrandTotal.innerText = formatter.format(totalPreTax + gst);
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

	inputArea.addEventListener('input', calculate);
	inputWeeks.addEventListener('input', calculate);
	quoteM2?.addEventListener('change', syncFormToEstimator);
	quoteDuration?.addEventListener('change', syncFormToEstimator);
	// After a quote is sent and the form clears, refill it from the estimator.
	quoteForm?.addEventListener('reset', () => window.setTimeout(calculate));
	calculate();

	// Analytics: the first time each slider is moved.
	const tracked = new Set();
	const trackOnce = (eventName) => {
		if (tracked.has(eventName) || typeof window.trackAnalyticsEvent !== 'function') return;
		tracked.add(eventName);
		window.trackAnalyticsEvent(eventName);
	};
	[
		[inputArea, 'area'],
		[inputWeeks, 'duration'],
	].forEach(([input, inputName]) => {
		input.addEventListener('input', () => {
			trackOnce('estimator_started');
			trackOnce(`estimator_${inputName}_adjusted`);
		});
	});
})();
