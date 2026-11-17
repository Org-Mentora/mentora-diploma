import { spawn } from 'node:child_process';
import { createWriteStream, mkdirSync } from 'node:fs';
import { join } from 'node:path';

const dir = process.env.BACKUP_DIR ?? 'backups';
const database = process.env.MONGO_DATABASE ?? 'mentora';
mkdirSync(dir, { recursive: true });
const stamp = new Date()
  .toISOString()
  .replace(/[-:]/g, '')
  .replace(/\.\d+Z$/, 'Z');
const target = join(dir, `${database}-dev-${stamp}.archive.gz`);

const dump = spawn(
  'docker',
  [
    'compose',
    'exec',
    '-T',
    'mongo',
    'mongodump',
    `--db=${database}`,
    '--gzip',
    '--archive',
    '--quiet',
  ],
  { stdio: ['ignore', 'pipe', 'inherit'] },
);
dump.stdout.pipe(createWriteStream(target));
dump.on('close', (code) => {
  if (code !== 0) {
    console.error(`db:backup failed (exit ${code}). Is \`docker compose up -d mongo\` running?`);
    process.exit(code ?? 1);
  }
  console.log(`db:backup → ${target}`);
});
