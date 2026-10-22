const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const root = path.resolve(__dirname, '../..');
const relative = 'packages/core/src/compiler/semantic/request-type-derivation/requestTypeDerivationAssessmentIntegrity.ts';
const source = fs.readFileSync(path.join(root, relative), 'utf8');
const checks = [
  ['authority integrity implementation is resolved at its actual upstream semantic owner', source.includes('export const validateRequestTypeDerivationSemanticAssessment')],
  ['contract correlation uses canonical object identity', /coverageContract === contract/.test(source)],
  ['generic recursive unknown evidence comparison removed', !/equivalentEvidence|\bunknown\b/.test(source)],
  ['dynamic string-to-reason lookup removed', !/Record<string, string>|Reflect\.get/.test(source)],
  ['authority decision reasons use explicit discriminated rule cases', ['judgment_verification_kind_conflict', 'rejection_reason_conflict', 'rejection_evidence_conflict', 'contract_law_coverage_incomplete', 'verified_law_coverage_incomplete'].every(rule => source.includes(`case '${rule}'`))],
  ['authority reason checker has exhaustive never branch', /const exhaustive: never = decision/.test(source)],
  ['derived assessment requires derived judgment', /case 'derivation_verified':[\s\S]*?decision\.premises\.judgment\.kind !== 'derived'/.test(source)],
  ['incomplete assessment requires incomplete judgment', /case 'incompleteness_verified':[\s\S]*?decision\.premises\.judgment\.kind !== 'incomplete'/.test(source)],
  ['conflict assessment requires conflict judgment', /case 'conflict_verified':[\s\S]*?decision\.premises\.judgment\.kind !== 'conflict'/.test(source)],
  ['verified outcomes require valid verification and complete coverage', (source.match(/decision\.premises\.verification\.kind !== 'valid'/g) ?? []).length === 3 && (source.match(/decision\.premises\.coverage\.kind !== 'complete'/g) ?? []).length === 3],
  ['validator does not infer or replace semantic judgments', !/\.infer\(|\.derive\(/.test(source)],
  ['validator avoids foundation and relation imports', !/semantic\/(foundation|relation)/.test(source)],
];
let failures = 0;
for (const [label, condition] of checks) {
  process.stdout.write(`${condition ? 'PASS' : 'FAIL'} ${label}\n`);
  if (!condition) failures += 1;
}
const result = ts.transpileModule(source, {
  fileName: path.basename(relative),
  compilerOptions: { target: ts.ScriptTarget.ES2024, module: ts.ModuleKind.ESNext },
  reportDiagnostics: true,
});
const syntaxErrors = (result.diagnostics ?? []).filter(item => item.category === ts.DiagnosticCategory.Error);
process.stdout.write(`${syntaxErrors.length === 0 ? 'PASS' : 'FAIL'} syntax transpilation ${relative}\n`);
failures += syntaxErrors.length;
process.stdout.write(`Phase 2579: ${checks.length + 1 - failures}/${checks.length + 1} assertions passed.\n`);
process.exitCode = failures === 0 ? 0 : 1;
