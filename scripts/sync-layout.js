// Copies the shared header, footer, back-to-top button and CONTACT US button from index.html
// into every other page. It also copies the home page's "get a quote" and "pricing estimator"
// sections into each page, wrapped in pop-up panels (the wrapper is written below, in popupPanels).
// index.html is the source of truth: edit them there, then run `npm run sync`
// (or `npm run build`, which runs this first).
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const source = 'index.html';

// Each block is matched from its opening tag to its closing tag.
const blocks = [
	{ name: 'skip link', pattern: /<a class="skip-link"[\s\S]*?<\/a>/ },
	{ name: 'header', pattern: /<nav class="site-header"[\s\S]*?<\/nav>/ },
	{ name: 'footer', pattern: /<footer\b[\s\S]*?<\/footer>/ },
	// Added straight after the footer on pages that don't have it yet.
	{ name: 'back-to-top button', pattern: /<a class="back-to-top"[\s\S]*?<\/a>/, insertAfter: /<\/footer>/ },
	{ name: 'contact us button', pattern: /<a class="contact-button[\s\S]*?<\/a>/, insertAfter: /<a class="back-to-top"[\s\S]*?<\/a>/ },
];

// Every page is a folder with an index.html, e.g. faq/index.html.
const pages = fs
	.readdirSync(root, { withFileTypes: true })
	.filter((entry) => entry.isDirectory() && !entry.name.startsWith('.') && entry.name !== 'node_modules')
	.map((entry) => path.join(entry.name, 'index.html'))
	.filter((page) => fs.existsSync(path.join(root, page)));

const indentBefore = (html, index) => html.slice(html.lastIndexOf('\n', index - 1) + 1, index);

// Re-indents a block so it lines up with wherever it sits in the target page.
const reindent = (block, fromIndent, toIndent) =>
	block
		.split('\n')
		.map((line, i) => (i === 0 ? line : toIndent + (line.startsWith(fromIndent) ? line.slice(fromIndent.length) : line)))
		.join('\n');

const sourceHtml = fs.readFileSync(path.join(root, source), 'utf8');
const sourceBlocks = blocks.map((block) => {
	const match = sourceHtml.match(block.pattern);
	if (!match) throw new Error(`${source}: could not find the ${block.name}`);
	return { ...block, html: match[0], indent: indentBefore(sourceHtml, match.index) };
});

// Pop-up panels: a home page section inside a dialog (see site-navigation.js). Only other pages
// get them; home shows the sections themselves. The contact panel slides up from the bottom of
// the screen, the estimator panel drops down from the top.
const closeIcon =
	'<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2.75" stroke-linecap="square" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18" /></svg>';
const popupPanels = [
	// Each panel goes after the one before it, starting after the CONTACT US button.
	{ name: 'contact', insertAfter: /<a class="contact-button[\s\S]*?<\/a>/ },
	{ name: 'estimator', insertAfter: /<dialog class="[^"]*contact-panel"[\s\S]*?<\/dialog>/ },
];
for (const { name, insertAfter } of popupPanels) {
	const section = sourceHtml.match(new RegExp(`<section\\b[^>]*\\bid="${name}"[\\s\\S]*?<\\/section>`));
	if (!section) throw new Error(`${source}: could not find the ${name} section`);
	sourceBlocks.push({
		name: `${name} panel`,
		// Matches the panel whatever its classes, so renaming them still replaces the old one.
		pattern: new RegExp(`<dialog class="[^"]*${name}-panel"[\\s\\S]*?<\\/dialog>`),
		insertAfter,
		indent: '',
		html: [
			`<dialog class="popup-panel ${name}-panel" aria-labelledby="${name}-title" data-${name}-panel>`,
			`\t<button class="popup-panel__close" type="button" aria-label="Close" data-panel-close>${closeIcon}</button>`,
			`\t${reindent(section[0], indentBefore(sourceHtml, section.index), '\t')}`,
			'</dialog>',
		].join('\n'),
	});
}

// Icons the pop-up panels need from the Material Symbols font (call, mail, the copy button's
// content_copy / check / error, and the estimator's arrow_forward). Each page only loads the icons it lists.
const panelIcons = ['arrow_forward', 'call', 'check', 'content_copy', 'error', 'mail'];
const iconFontUrl = (names) =>
	`https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@24,400,0,0&amp;icon_names=${names.join(',')}&amp;display=swap`;

const addPanelIcons = (html, page) => {
	const list = html.match(/(Material\+Symbols\+Outlined[^"]*?icon_names=)([^&"]*)/);
	if (list) {
		// Google needs the names in alphabetical order.
		const names = [...new Set([...list[2].split(','), ...panelIcons])].filter(Boolean).sort();
		return html.replace(list[0], list[1] + names.join(','));
	}
	const styles = html.match(/^([ \t]*)<link rel="stylesheet" href="[^"]*styles\.css" \/>/m);
	if (!styles) throw new Error(`${page}: nowhere to add the icon font`);
	const link = `${styles[1]}<link\n${styles[1]}\thref="${iconFontUrl(panelIcons)}"\n${styles[1]}\trel="stylesheet" />\n`;
	return html.slice(0, styles.index) + link + html.slice(styles.index);
};

let changed = 0;
for (const page of pages) {
	const file = path.join(root, page);
	const original = fs.readFileSync(file, 'utf8');
	let html = original;

	for (const block of sourceBlocks) {
		const match = html.match(block.pattern);
		if (!match && block.insertAfter) {
			const anchor = html.match(block.insertAfter);
			if (!anchor) throw new Error(`${page}: nowhere to add the ${block.name}`);
			const at = anchor.index + anchor[0].length;
			html = `${html.slice(0, at)}\n${block.html}${html.slice(at)}`;
			continue;
		}
		if (!match) throw new Error(`${page}: could not find the ${block.name}`);
		const updated = reindent(block.html, block.indent, indentBefore(html, match.index));
		html = html.slice(0, match.index) + updated + html.slice(match.index + match[0].length);
	}

	html = addPanelIcons(html, page);

	if (html !== original) {
		fs.writeFileSync(file, html);
		changed += 1;
		console.log(`synced ${page}`);
	}
}

console.log(`Shared layout synced from ${source}: ${changed} of ${pages.length} pages updated.`);
