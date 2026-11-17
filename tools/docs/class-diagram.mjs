import { execSync } from 'node:child_process';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import ts from 'typescript';

const OUTPUT = 'docs/architecture/class-diagram.md';
const check = process.argv.includes('--check');

const MODULE_TITLES = {
  appointments: 'Appointments (CU-10, CU-11, CU-12, CU-13, CU-14)',
  auth: 'Auth and account (CU-01, CU-02, CU-03, CU-16, CU-17)',
  'clinical-records': 'Clinical records (CU-07, CU-08, CU-09)',
  'diagnosis-catalog': 'Diagnosis catalog',
  health: 'Health',
  notifications: 'Notifications',
  patients: 'Patients (CU-04, CU-05, CU-06)',
  subscriptions: 'Subscriptions and payments (CU-18)',
  'virtual-consultations': 'Virtual consultations (CU-15)',
};

const files = execSync('git ls-files --cached --others --exclude-standard', { encoding: 'utf8' })
  .split('\n')
  .filter((file) => /^apps\/(api|web)\/src\/.*\.tsx?$/.test(file))
  .filter((file) => !/\.(test|spec)\.tsx?$/.test(file))
  .filter((file) => !/\.generated\.ts$/.test(file))
  .filter((file) => !file.startsWith('apps/web/src/model/api/generated/'))
  .filter((file) => existsSync(file))
  .sort();

function sectionOf(file) {
  const api = file.match(/^apps\/api\/src\/([^/]+)(?:\/([^/]+))?/);
  if (api) {
    if (api[1] === 'modules') return `api:module:${api[2]}`;
    return `api:${api[1]}`;
  }
  return 'web';
}

const SECTION_ORDER = (key) => {
  if (key === 'api:core') return '0';
  if (key === 'api:infrastructure') return '1';
  if (key === 'api:app' || key === 'api:main.ts') return '2';
  if (key.startsWith('api:module:')) return `3${key}`;
  return `9${key}`;
};

function sectionTitle(key) {
  if (key === 'api:core') return 'API core (shared kernel)';
  if (key === 'api:infrastructure') return 'API infrastructure';
  if (key === 'api:app' || key === 'api:main.ts') return 'API composition root';
  if (key.startsWith('api:module:')) {
    const name = key.slice('api:module:'.length);
    return `API module: ${MODULE_TITLES[name] ?? name}`;
  }
  return 'Web model and store';
}

function hasModifier(node, kind) {
  return (ts.getCombinedModifierFlags(node) & kind) !== 0;
}

function visibility(node) {
  if (hasModifier(node, ts.ModifierFlags.Private)) return '-';
  if (node.name && ts.isPrivateIdentifier(node.name)) return '-';
  if (hasModifier(node, ts.ModifierFlags.Protected)) return '#';
  return '+';
}

function typeText(node) {
  if (!node) return '';
  switch (node.kind) {
    case ts.SyntaxKind.TypeReference: {
      const name = node.typeName.getText().split('.').pop();
      const args = node.typeArguments?.map(typeText) ?? [];
      return args.length > 0 ? `${name}~${args.join(', ')}~` : name;
    }
    case ts.SyntaxKind.ArrayType:
      return `${typeText(node.elementType)}[]`;
    case ts.SyntaxKind.UnionType: {
      const parts = [...new Set(node.types.map(typeText))];
      return parts.join(' | ');
    }
    case ts.SyntaxKind.ParenthesizedType:
      return typeText(node.type);
    case ts.SyntaxKind.TypeOperator:
      return typeText(node.type);
    case ts.SyntaxKind.LiteralType:
      if (node.literal.kind === ts.SyntaxKind.NullKeyword) return 'null';
      if (ts.isStringLiteral(node.literal)) return 'string';
      if (ts.isNumericLiteral(node.literal)) return 'number';
      return 'boolean';
    case ts.SyntaxKind.FunctionType:
      return 'Function';
    case ts.SyntaxKind.TypeLiteral:
    case ts.SyntaxKind.MappedType:
      return 'object';
    case ts.SyntaxKind.TupleType:
      return 'tuple';
    default: {
      const text = node.getText();
      return /^[\w.]+$/.test(text) ? text.split('.').pop() : 'type';
    }
  }
}

function referencedNames(node, into = new Set()) {
  if (!node) return into;
  if (ts.isTypeReferenceNode(node)) into.add(node.typeName.getText().split('.').pop());
  ts.forEachChild(node, (child) => referencedNames(child, into));
  return into;
}

function memberName(node) {
  if (!node.name) return null;
  if (ts.isPrivateIdentifier(node.name)) return null;
  return node.name.getText();
}

function readClass(node, file) {
  const name = node.name?.text;
  if (!name) return null;
  const sf = node.getSourceFile();
  const leading = ts.getLeadingCommentRanges(sf.text, node.getFullStart()) ?? [];
  const patterns = leading
    .map((r) => sf.text.slice(r.pos, r.end))
    .filter((c) => c.startsWith('// '))
    .map((c) => c.slice(3).trim());
  const info = {
    name,
    file,
    section: sectionOf(file),
    abstract: hasModifier(node, ts.ModifierFlags.Abstract),
    typeParameters: node.typeParameters?.map((p) => p.name.text) ?? [],
    patterns,
    extends: null,
    implements: [],
    members: [],
    dependencies: new Set(),
  };
  for (const clause of node.heritageClauses ?? []) {
    for (const type of clause.types) {
      const target = type.expression.getText().split('.').pop();
      if (clause.token === ts.SyntaxKind.ExtendsKeyword) info.extends = target;
      else info.implements.push(target);
    }
  }
  for (const member of node.members) {
    if (ts.isConstructorDeclaration(member)) {
      for (const param of member.parameters) {
        for (const ref of referencedNames(param.type)) info.dependencies.add(ref);
        const isProperty =
          ts.getCombinedModifierFlags(param) &
          (ts.ModifierFlags.ParameterPropertyModifier | ts.ModifierFlags.Readonly);
        if (isProperty) {
          info.members.push(`${visibility(param)}${param.name.getText()}: ${typeText(param.type)}`);
        }
      }
      continue;
    }
    const name = memberName(member);
    if (!name) continue;
    const vis = visibility(member);
    const isStatic = hasModifier(member, ts.ModifierFlags.Static);
    const isAbstract = hasModifier(member, ts.ModifierFlags.Abstract);
    if (ts.isMethodDeclaration(member)) {
      if (vis === '-') continue;
      const params = member.parameters.map((p) => p.name.getText().replace(/[{}\s]/g, ''));
      const returns = member.type ? ` ${typeText(member.type)}` : '';
      const suffix = isAbstract ? '*' : isStatic ? '$' : '';
      info.members.push(`${vis}${name}(${params.join(', ')})${suffix}${returns}`);
    } else if (ts.isGetAccessorDeclaration(member)) {
      if (vis === '-') continue;
      info.members.push(`${vis}${name}: ${typeText(member.type) || 'value'}`);
    } else if (ts.isPropertyDeclaration(member)) {
      if (vis === '-') continue;
      const type = member.type ? typeText(member.type) : '';
      info.members.push(`${vis}${name}${type ? `: ${type}` : ''}${isStatic ? '$' : ''}`);
      for (const ref of referencedNames(member.type)) info.dependencies.add(ref);
    }
  }
  return info;
}

const classes = new Map();
const moduleEdges = new Set();
for (const file of files) {
  const text = readFileSync(file, 'utf8');
  const kind = file.endsWith('.tsx') ? ts.ScriptKind.TSX : ts.ScriptKind.TS;
  const sf = ts.createSourceFile(file, text, ts.ScriptTarget.Latest, true, kind);
  const owner = file.match(/^apps\/api\/src\/modules\/([^/]+)\//)?.[1];
  for (const statement of sf.statements) {
    if (ts.isClassDeclaration(statement)) {
      const info = readClass(statement, file);
      if (!info) continue;
      if (classes.has(info.name)) {
        throw new Error(
          `Duplicate class name ${info.name}: ${classes.get(info.name).file}, ${file}`,
        );
      }
      classes.set(info.name, info);
    }
    if (owner && ts.isImportDeclaration(statement)) {
      const target = statement.moduleSpecifier.text.match(/^#modules\/([^/]+)/)?.[1];
      if (target && target !== owner) moduleEdges.add(`${owner}|${target}`);
    }
  }
}

function label(info) {
  return info.typeParameters.length > 0
    ? `${info.name}~${info.typeParameters.join(', ')}~`
    : info.name;
}

function renderSection(key) {
  const own = [...classes.values()]
    .filter((c) => c.section === key)
    .sort((a, b) => a.name.localeCompare(b.name));
  const external = new Set();
  const edges = [];
  const relate = (from, to, arrow) => {
    if (!classes.has(to) || from === to) return;
    if (classes.get(to).section !== key) external.add(to);
    edges.push(`  ${to} ${arrow} ${from}`);
  };
  for (const info of own) {
    if (info.extends) relate(info.name, info.extends, '<|--');
    for (const target of info.implements) relate(info.name, target, '<|..');
    for (const dep of [...info.dependencies].sort()) {
      if (dep === info.extends || info.implements.includes(dep)) continue;
      if (!classes.has(dep) || dep === info.name) continue;
      if (classes.get(dep).section !== key) external.add(dep);
      edges.push(`  ${info.name} --> ${dep}`);
    }
  }
  const lines = ['```mermaid', 'classDiagram', '  direction LR'];
  for (const info of own) {
    lines.push(`  class ${label(info)} {`);
    const annotations = [];
    if (info.abstract) annotations.push('abstract');
    if (info.patterns.length > 0) annotations.push(info.patterns.join(', '));
    if (annotations.length > 0) lines.push(`    <<${annotations.join(' · ')}>>`);
    for (const member of info.members) lines.push(`    ${member}`);
    lines.push('  }');
  }
  for (const name of [...external].sort()) {
    lines.push(`  class ${name} {`, '    <<external>>', '  }');
  }
  lines.push(...[...new Set(edges)].sort());
  lines.push('```');
  return { count: own.length, body: lines.join('\n') };
}

function renderModuleMap() {
  const modules = [
    ...new Set(
      [...classes.values()]
        .filter((c) => c.section.startsWith('api:module:'))
        .map((c) => c.section.slice(11)),
    ),
  ].sort();
  const id = (name) => name.replace(/-/g, '_');
  const lines = ['```mermaid', 'flowchart LR'];
  for (const name of modules) lines.push(`  ${id(name)}["${name}"]`);
  for (const edge of [...moduleEdges].sort()) {
    const [from, to] = edge.split('|');
    lines.push(`  ${id(from)} --> ${id(to)}`);
  }
  lines.push('```');
  return lines.join('\n');
}

const sections = [...new Set([...classes.values()].map((c) => c.section))].sort((a, b) =>
  SECTION_ORDER(a).localeCompare(SECTION_ORDER(b)),
);

const parts = [
  '# Class diagram',
  '',
  '> Generated from the TypeScript sources by `pnpm docs:classes` (`tools/docs/class-diagram.mjs`).',
  '> Do not edit it by hand: CI runs `pnpm docs:check` and fails when it is out of date.',
  '',
  '## How to read it',
  '',
  '- One diagram per layer or API module, so each one stays readable.',
  '- `<<…>>` shows `abstract` and the design pattern named by the class comment (ADR-0035).',
  '- `<|--` is inheritance, `<|..` is an implemented abstraction, `-->` is a constructor or field',
  '  dependency (the arrow points at what the class needs).',
  '- `<<external>>` boxes are classes from another section; their members are in their own diagram.',
  '- Members: `+` public, `#` protected, `-` private (only injected dependencies are listed),',
  '  `*` abstract, `$` static. Private methods are left out.',
  '- The web is MVVM with hooks, so only its model adapters and the store are classes. Its',
  '  ViewModels and Views are described in [frontend-mvvm.md](frontend-mvvm.md).',
  '',
  '## Module dependencies',
  '',
  'API modules only talk through the public `index.ts` of another module (ADR-0022, ADR-0033).',
  '',
  renderModuleMap(),
  '',
];

for (const key of sections) {
  const { count, body } = renderSection(key);
  parts.push(`## ${sectionTitle(key)}`, '', `${count} classes.`, '', body, '');
}

const output = `${parts.join('\n').trimEnd()}\n`;

if (check) {
  let current = '';
  try {
    current = readFileSync(OUTPUT, 'utf8').replace(/\r\n/g, '\n');
  } catch {}
  if (current !== output) {
    console.error(`${OUTPUT} is out of date. Run \`pnpm docs:classes\` and commit the result.`);
    process.exit(1);
  }
  console.log(`docs: ${OUTPUT} is up to date (${classes.size} classes)`);
} else {
  writeFileSync(OUTPUT, output);
  console.log(`docs: wrote ${OUTPUT} (${classes.size} classes in ${sections.length} diagrams)`);
}
