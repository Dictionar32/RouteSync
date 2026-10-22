const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '../..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const checks = [];
const check = (name, condition, evidence) => checks.push({ name, passed: Boolean(condition), evidence });

const hasherPath = 'packages/core/src/compiler/types/TypeHasher.ts';
const interfacePath = 'packages/core/src/types/upstream/typeHasherInterface.ts';
const barrelPath = 'packages/core/src/types/upstream/index.ts';
const hasher = read(hasherPath);
const contract = read(interfacePath);
const barrel = read(barrelPath);

check('TypeHasher has no direct semantic/relations import', !/from\s+['"][^'"]*semantic\/relations\//.test(hasher), hasherPath);
check('TypeHasher has no direct semantic/foundation import', !/from\s+['"][^'"]*semantic\/foundation\//.test(hasher), hasherPath);
check('An upstream TypeHasherInterface contract exists', /export interface TypeHasherInterface/.test(contract), interfacePath);
check('Hash context and cache-entry datum are upstream-owned', /export interface TypeHashContext/.test(contract) && /export type TypeHashEntry/.test(contract), interfacePath);
check('Implementation is explicitly typed by the upstream interface', /export const TypeHasher:\s*TypeHasherInterface\s*=/.test(hasher), hasherPath);
check('Existing HashContext public name is preserved as a type alias', /export type HashContext\s*=\s*TypeHashContext/.test(hasher), hasherPath);
check('Upstream barrel exports the new contract', /export \* from '\.\/typeHasherInterface'/.test(barrel), barrelPath);
check('Type hashing uses no relation-index implementation import', !/RelationIndex|relationIndexLookup|relationIndexAdd|relationResolve|relationProject/.test(hasher), hasherPath);

const failed = checks.filter(item => !item.passed);
const result = {
  phase: 2512,
  title: 'TypeHasher Upstream Interface and Relation Cutover',
  total: checks.length,
  passed: checks.length - failed.length,
  failed: failed.length,
  checks,
  remainingKnownDebt: [
    'requestAstCanonical.ts still imports semantic/relations directly.',
    'operations/form-request/canonicalValidationRuleEntry.ts and ruleCollector.ts still import semantic/relations directly.',
    'TypeInterner relation-free status is only direct-import clean; transitive closure requires tracing all reachable dependencies.',
    'The Laravel pipeline still imports legacy subscanners for response, schema, migration, DTO, query, service, middleware, and provider.',
    'Full project typecheck, package build, Vitest, and CLI end-to-end have not passed in this environment.'
  ]
};

const reportPath = path.join(root, 'reports/PHASE2512_TYPE_HASHER_UPSTREAM_INTERFACE_AUDIT.json');
fs.mkdirSync(path.dirname(reportPath), { recursive: true });
fs.writeFileSync(reportPath, `${JSON.stringify(result, null, 2)}\n`);
for (const item of checks) console.log(`${item.passed ? 'PASS' : 'FAIL'} ${item.name} — ${item.evidence}`);
console.log(`\nFocused assertions: ${result.passed}/${result.total}`);
console.log(`Report: ${path.relative(root, reportPath)}`);
if (failed.length > 0) process.exitCode = 1;
