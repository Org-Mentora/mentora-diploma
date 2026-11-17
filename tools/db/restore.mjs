import { spawn } from 'node:child_process';
import { createReadStream, existsSync } from 'node:fs';

const archive = process.argv[2];
const database = process.env.MONGO_DATABASE ?? 'mentora';
if (!archive || !existsSync(archive)) {
  console.error('usage: pnpm db:restore <backups/mentora-*.archive.gz>');
  process.exit(1);
}

const restore = spawn(
  'docker',
  [
    'compose',
    'exec',
    '-T',
    'mongo',
    'mongorestore',
    '--drop',
    '--gzip',
    '--archive',
    `--nsInclude=${database}.*`,
  ],
  { stdio: ['pipe', 'inherit', 'inherit'] },
);
createReadStream(archive).pipe(restore.stdin);
restore.on('close', (code) => {
  if (code !== 0) {
    console.error(`db:restore failed (exit ${code})`);
    process.exit(code ?? 1);
  }
  console.log(`db:restore ← ${archive}`);
});
