import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { Application } from '../app/Application';

const target = resolve(import.meta.dirname, '../../../../packages/contracts/openapi.json');
writeFileSync(target, `${JSON.stringify(new Application().openApiDocument, null, 2)}\n`);
console.log(`OpenAPI document written to ${target}`);
