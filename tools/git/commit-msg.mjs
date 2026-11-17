import { readFileSync } from 'node:fs';

const TYPES = 'feat|fix|docs|chore|refactor|test|build|ci|perf|style|revert';
const PATTERN = new RegExp(`^(${TYPES})(\\([a-z0-9-]+\\))?!?: \\S.*$`);

const [header = ''] = readFileSync(process.argv[2], 'utf8').split(/\r?\n/);

if (!PATTERN.test(header) && !header.startsWith('Merge ')) {
  console.error(`Invalid commit message: "${header}"`);
  console.error(
    `Expected "<type>(<scope>)?: <subject>" with type in: ${TYPES.replaceAll('|', ', ')}`,
  );
  console.error('Example: feat(api): add mentors module');
  process.exit(1);
}
