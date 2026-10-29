const fs = require('node:fs');
const path = require('node:path');

const root = process.cwd();
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const checks = [];
const check = (name, condition, evidence) => checks.push({ name, passed: Boolean(condition), evidence });

const contractPath = 'packages/core/src/types/upstream/requestProducerInterface.ts';
const activePath = 'packages/core/src/compiler/scanner/operations/requestProducer.ts';
const legacyPath = 'packages/core/src/compiler/scanner/operations/requestProducer.ts';
const scannerPath = 'packages/core/src/compiler/scanner/laravelFormRequestScanner.ts';
const contract = read(contractPath);
const active = read(activePath);
const legacy = read(legacyPath);
const scanner = read(scannerPath);

check('Upstream request producer contract has no compiler/parser imports',
  !/from ['"][^'"]*compiler\//.test(contract), contractPath);
check('Upstream request producer input parameterizes parser evidence instead of owning it',
  /interface RequestProducerInput<RulesEvidence, MethodEvidence, PropertyEvidence>/.test(contract) &&
  /readonly rules: RulesEvidence/.test(contract) &&
  /readonly authorize: MethodEvidence/.test(contract) &&
  /readonly properties: readonly PropertyEvidence\[\]/.test(contract), contractPath);
check('Upstream operation contract carries evidence parameters through both operations',
  /interface RequestProducerInterface<RulesEvidence, MethodEvidence, PropertyEvidence>/.test(contract) &&
  /RequestProducerInput<RulesEvidence, MethodEvidence, PropertyEvidence>/.test(contract), contractPath);
check('Active producer binds evidence types at its implementation boundary',
  /export const requestProducer:\s*RequestProducerContract/.test(active) &&
  /RequestProducerInterface<readonly PhpArrayEntry\[\], PhpMethodAst, PhpClassPropertyAst>/.test(active), activePath);
check('Active producer has no direct relations/foundation imports',
  !/semantic\/(?:relations|foundation)\//.test(active), activePath);
check('Active scanner remains interface-first and outside operations',
  /export const laravelFormRequestScanner:\s*LaravelFormRequestScannerInterface/.test(scanner) &&
  !/from ['"][^'"]*operations\//.test(scanner), scannerPath);
check('Legacy producer receives only a type-level generic specialization',
  /RequestProducerInterface<readonly PhpArrayEntry\[\], PhpMethodAst, PhpClassPropertyAst>/.test(legacy), legacyPath);
check('Existing TypeInterner contract remains upstream-owned',
  /TypeInternerInterface/.test(contract) && !/compiler\/types\/TypeInterner/.test(contract), contractPath);

for (const result of checks) {
  process.stdout.write(`${result.passed ? 'PASS' : 'FAIL'} ${result.name} — ${result.evidence}\n`);
}
process.stdout.write(`\nFocused assertions: ${checks.filter(item => item.passed).length}/${checks.length}\n`);
const report = { phase: 2511, scope: 'RequestProducer evidence ownership boundary', checks,
  unresolved: [
    'requestAstCanonical.ts and operations/form-request/* still directly import semantic/relations.',
    'TypeHasher.ts still imports semantic/relations; TypeInterner transitive relation closure is not proven.',
    'The active Laravel pipeline still imports legacy operations for response, schema, migration, DTO, query, service, middleware, and provider.',
    'Full TypeScript typecheck, package build, Vitest, and CLI end-to-end remain unverified in this environment.'
  ] };
fs.writeFileSync(path.join(root, 'PHASE2511_REQUEST_PRODUCER_EVIDENCE_OWNERSHIP_AUDIT.json'), JSON.stringify(report, null, 2) + '\n');
if (checks.some(item => !item.passed)) process.exitCode = 1;
