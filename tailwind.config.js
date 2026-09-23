// Points a Tailwind colour at a CSS variable, keeping opacity modifiers like bg-yellow/10 working.
const colour = (name) => `color-mix(in srgb, var(--${name}) calc(<alpha-value> * 100%), transparent)`;

module.exports = {
	content: ['./**/*.html'],
	darkMode: 'class',
	theme: {
		extend: {
			// Colour values live in assets/css/source.css (:root). Edit them there.
			colors: {
				yellow: colour('yellow'),
				'yellow-ink': colour('yellow-ink'),
				navy: {
					950: colour('navy-950'),
					900: colour('navy-900'),
					850: colour('navy-850'),
					800: colour('navy-800'),
					700: colour('navy-700'),
					600: colour('navy-600'),
					500: colour('navy-500'),
				},
				teal: colour('teal'),
				grey: {
					50: colour('grey-50'),
					100: colour('grey-100'),
					200: colour('grey-200'),
					300: colour('grey-300'),
					500: colour('grey-500'),
					700: colour('grey-700'),
				},
			},
			borderRadius: {
				DEFAULT: '0.25rem',
				lg: '0.25rem',
				xl: '0.5rem',
				full: '0.75rem',
			},
			fontFamily: {
				body: ['Inter', 'sans-serif'],
				display: ['Golos Text', 'sans-serif'],
				headline: ['Inter', 'sans-serif'],
			},
			fontWeight: {
				normal: '400',
				medium: '500',
				semibold: '600',
				bold: '600',
				extrabold: '600',
				black: '600',
			},
		},
	},
};
