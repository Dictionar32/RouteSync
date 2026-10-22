const fs = require('node:fs');
const path = require('node:path');
let ts;
try {
  ts = require('typescript');
} catch {
  ts = require('/opt/nvm/versions/node/v22.16.0/lib/node_modules/typescript');
}

const root = path.resolve(__dirname, '../..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const files = [
  'packages/core/src/types/upstream/schema.ts',
  'packages/core/src/types/upstream/migrationInterface.ts',
  'packages/core/src/types/upstream/highLevelContracts.ts',
  'packages/core/src/types/upstream/highLevelSourceModel.ts',
  'packages/core/src/types/upstream/__tests__/laravel-domain-contract-closure.phase1692.test.ts',
];
const failures = [];
const checks = [];
const check = (name, condition) => {
  checks.push({ name, passed: Boolean(condition) });
  if (!condition) failures.push(name);
};

for (const relative of files) {
  const source = read(relative);
  const result = ts.transpileModule(source, {
    fileName: relative,
    reportDiagnostics: true,
    compilerOptions: {
      target: ts.ScriptTarget.ESNext,
      module: ts.ModuleKind.ESNext,
      strict: true,
    },
  });
  const syntaxErrors = (result.diagnostics ?? []).filter(diagnostic => diagnostic.category === ts.DiagnosticCategory.Error);
  check(`typescript syntax: ${relative}`, syntaxErrors.length === 0);
}

const contracts = read('packages/core/src/types/upstream/highLevelContracts.ts');
const model = read('packages/core/src/types/upstream/highLevelSourceModel.ts');
const test = read('packages/core/src/types/upstream/__tests__/laravel-domain-contract-closure.phase1692.test.ts');
for (const [name, pattern] of [
  ['domain union contains schema', /export type LaravelDomainContract =[\s\S]*\| SchemaHighLevelContract/],
  ['domain union contains migration', /\| MigrationHighLevelContract/],
  ['domain union contains DTO', /\| DtoHighLevelContract/],
  ['domain union contains middleware', /\| MiddlewareHighLevelContract/],
  ['domain union contains attribute', /\| AttributeHighLevelContract/],
  ['domain union contains channel', /\| ChannelHighLevelContract/],
  ['schema catalog uses closed contract', /schemas: import\('\.\/collections'\)\.Sequence<SchemaHighLevelContract>/],
  ['migration catalog uses closed contract', /migrations: import\('\.\/collections'\)\.Sequence<MigrationHighLevelContract>/],
]) check(name, pattern.test(contracts));
check('schema catalog projection uses canonical constructor', /sequenceProject\(catalog\.schemas, schemaInterfaceFromDefinition\)/.test(model));
check('migration catalog projection uses canonical constructor', /sequenceProject\(catalog\.migrations, migrationInterfaceFromDefinition\)/.test(model));
check('type regression test covers closed interfaces and scanned domains', /toEqualTypeOf<Sequence<SchemaInterface>>/.test(test) && /toEqualTypeOf<Sequence<MigrationInterface>>/.test(test) && /Includes<'dto', DtoDefinition>/.test(test));

const report = {
  phase: 1692,
  title: 'Laravel Domain Interface Closure',
  checks: checks.length,
  passed: checks.filter(item => item.passed).length,
  failed: failures.length,
  failures,
  checksDetail: checks,
  note: 'This audit checks source syntax and interface wiring invariants. It does not replace a full TypeScript typecheck or Vitest run.',
};
fs.writeFileSync(path.join(root, 'PHASE1692_LARAVEL_DOMAIN_INTERFACE_CLOSURE_AUDIT.json'), `${JSON.stringify(report, null, 2)}\n`);
console.log(`${report.passed}/${report.checks} checks passed`);
for (const failure of failures) console.error(`FAIL ${failure}`);
process.exitCode = failures.length ? 1 : 0;
