// Every page: the price estimator, kept in step with the quote form's m² and duration fields.
// On home it's a section on the page; on other pages it's in the drop-down estimator panel.
(() => {
	const inputArea = document.getElementById('inputArea');
	const inputWeeks = document.getElementById('inputWeeks');
	if (!inputArea || !inputWeeks) return;

	// Pricing: installation per m², then weekly hire as a share of the installation (before GST).
	const installPerM2 = 3.5;
	const weeklyHireRate = 0.1;
	const gstRate = 0.15;

	const areaNumber = document.getElementById('areaNumber');
	const weeksNumber = document.getElementById('weeksNumber');
	const weeksUnit = document.getElementById('weeksUnit');
	const resInstall = document.getElementById('resInstall');
	const resHire = document.getElementById('resHire');
	const hireWeeks = document.getElementById('hireWeeks');
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
		// The number boxes follow the sliders, except while someone is typing in them.
		if (areaNumber && document.activeElement !== areaNumber) areaNumber.value = area;
		if (weeksNumber && document.activeElement !== weeksNumber) weeksNumber.value = weeks;
		if (weeksUnit) weeksUnit.innerText = weeks === 1 ? 'Week' : 'Weeks';
		if (hireWeeks) hireWeeks.innerText = `${weeks} ${weeks === 1 ? 'week' : 'weeks'}`;
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

	// Typing a number moves its slider. Mid-typing values outside the range (the "2" on the way
	// to "200") are left alone; leaving the box or pressing Enter pulls them back into range.
	const linkNumberToSlider = (number, slider, wholeNumbers) => {
		if (!number) return;
		const min = parseFloat(slider.min);
		const max = parseFloat(slider.max);
		// The first click puts the cursor after the last digit, wherever it lands in the figure.
		number.addEventListener('focus', () => {
			window.setTimeout(() => number.setSelectionRange(number.value.length, number.value.length));
		});
		number.addEventListener('input', () => {
			const digits = number.value.replace(/\D/g, '');
			if (digits !== number.value) number.value = digits;
			const value = parseFloat(number.value);
			if (Number.isNaN(value) || value < min || value > max) return;
			slider.value = wholeNumbers ? Math.round(value) : value;
			calculate();
		});
		number.addEventListener('change', () => {
			const value = clampValue(number.value, min, max);
			slider.value = wholeNumbers ? Math.round(value) : value;
			number.value = slider.value;
			calculate();
		});
	};

	inputArea.addEventListener('input', calculate);
	inputWeeks.addEventListener('input', calculate);
	linkNumberToSlider(areaNumber, inputArea, false);
	linkNumberToSlider(weeksNumber, inputWeeks, true);
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
		[areaNumber, 'area'],
		[inputWeeks, 'duration'],
		[weeksNumber, 'duration'],
	].forEach(([input, inputName]) => {
		input?.addEventListener('input', () => {
			trackOnce('estimator_started');
			trackOnce(`estimator_${inputName}_adjusted`);
		});
	});
})();
