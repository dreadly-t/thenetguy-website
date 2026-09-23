// Copies the shared header and footer from index.html into every other page.
// index.html is the source of truth: edit the header/footer there, then run `npm run sync`
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

let changed = 0;
for (const page of pages) {
	const file = path.join(root, page);
	const original = fs.readFileSync(file, 'utf8');
	let html = original;

	for (const block of sourceBlocks) {
		const match = html.match(block.pattern);
		if (!match) throw new Error(`${page}: could not find the ${block.name}`);
		const updated = reindent(block.html, block.indent, indentBefore(html, match.index));
		html = html.slice(0, match.index) + updated + html.slice(match.index + match[0].length);
	}

	if (html !== original) {
		fs.writeFileSync(file, html);
		changed += 1;
		console.log(`synced ${page}`);
	}
}

console.log(`Header and footer synced from ${source}: ${changed} of ${pages.length} pages updated.`);
