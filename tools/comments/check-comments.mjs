import { execSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import ts from 'typescript';

export const PATTERNS = [
  'Abstract Factory',
  'Adapter',
  'Aggregate Root',
  'Command',
  'Composition Root',
  'Data Mapper',
  'Entity',
  'Facade',
  'Iterator',
  'Passive View',
  'Presenter',
  'Repository',
  'Singleton',
  'State',
  'Strategy',
  'Template Method',
  'Unit of Work',
  'Value Object',
  'ViewModel',
];

const DIRECTIVE =
  /biome-ignore|@ts-(expect-error|ignore|nocheck)|^\/\/\/\s*<reference|@vite-ignore|@vitest-environment|[#@]__PURE__/;
const PATTERN_COMMENT = new RegExp(`^// (${PATTERNS.join('|')})(, (${PATTERNS.join('|')}))*$`);

const files = execSync('git ls-files --cached --others --exclude-standard', { encoding: 'utf8' })
  .split('\n')
  .filter((file) => /\.(ts|tsx|mts|cts|js|mjs|cjs|css)$/.test(file))
  .filter((file) => !/(^|\/)node_modules\//.test(file))
  .filter((file) => !/\.generated\.ts$/.test(file))
  .filter((file) => !file.startsWith('apps/web/src/model/api/generated/'));

function commentsOf(file, text) {
  if (file.endsWith('.css')) {
    return [...text.matchAll(/\/\*[\s\S]*?\*\//g)].map((m) => ({ pos: m.index, text: m[0] }));
  }
  const kind = file.endsWith('.tsx')
    ? ts.ScriptKind.TSX
    : /\.(js|mjs|cjs)$/.test(file)
      ? ts.ScriptKind.JS
      : ts.ScriptKind.TS;
  const sf = ts.createSourceFile(file, text, ts.ScriptTarget.Latest, true, kind);
  const found = new Map();
  const jsxText = [];
  const visit = (node) => {
    if (node.kind === ts.SyntaxKind.JsxText) {
      jsxText.push([node.pos, node.end]);
      return;
    }
    for (const r of [
      ...(ts.getLeadingCommentRanges(text, node.pos) ?? []),
      ...(ts.getTrailingCommentRanges(text, node.end) ?? []),
    ]) {
      found.set(r.pos, { pos: r.pos, text: text.slice(r.pos, r.end) });
    }
    for (const child of node.getChildren(sf)) visit(child);
  };
  visit(sf);
  return [...found.values()].filter((c) => !jsxText.some(([s, e]) => c.pos >= s && c.pos < e));
}

const violations = [];
for (const file of files) {
  let text;
  try {
    text = readFileSync(file, 'utf8');
  } catch {
    continue;
  }
  for (const comment of commentsOf(file, text)) {
    if (DIRECTIVE.test(comment.text) || PATTERN_COMMENT.test(comment.text)) continue;
    const line = text.slice(0, comment.pos).split('\n').length;
    violations.push(`${file}:${line}  ${comment.text.split('\n')[0].slice(0, 80)}`);
  }
}

if (violations.length > 0) {
  console.error(
    `Comments may only name a design pattern (ADR-0035), e.g. "// Adapter".\n` +
      `Allowed: ${PATTERNS.join(', ')}.\n\n${violations.join('\n')}`,
  );
  process.exit(1);
}
console.log(`comments: ${files.length} files checked, only design pattern names found`);
