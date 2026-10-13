/**
 * Generates RTK Query endpoints + hooks from the API OpenAPI document (ADR-0010).
 * Output is injected into `baseApi`; never edit the generated file by hand.
 */
import { mkdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { generateEndpoints } from '@rtk-query/codegen-openapi';

const root = resolve(import.meta.dirname, '..');
// The generator derives the `baseApi` import from these paths, so they must stay relative.
process.chdir(root);
mkdirSync('src/model/api/generated', { recursive: true });

await generateEndpoints({
  schemaFile: '../../packages/contracts/openapi.json',
  apiFile: './src/model/api/baseApi.ts',
  apiImport: 'baseApi',
  outputFile: './src/model/api/generated/mentoraApi.ts',
  exportName: 'mentoraApi',
  hooks: true,
  tag: true,
});

console.log('RTK Query endpoints generated in src/model/api/generated/mentoraApi.ts');
