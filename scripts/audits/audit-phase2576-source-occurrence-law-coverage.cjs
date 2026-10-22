const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const root = path.resolve(__dirname, '../..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const contract = read('packages/core/src/types/upstream/requestTypeDerivationInterface.ts');
const verifier = read('packages/core/src/compiler/semantic/request-type-derivation/requestTypeDerivationSourceOccurrenceVerification.ts');
const guardedBlock = verifier.match(/const SOURCE_OCCURRENCE_LAWS:[\s\S]*?\]\);/);
const guardedLaws = [...(guardedBlock?.[0] ?? '').matchAll(/'([a-z_]+)'/g)].map(match => match[1]);
const failureBlock = verifier.match(/const toCanonicalFailure = \([\s\S]*?\n};/);
const emittedLaws = [...new Set([...(failureBlock?.[0] ?? '').matchAll(/law: '([a-z_]+)'/g)].map(match => match[1]))];
const canonicalLawBlock = contract.match(/export const REQUEST_TYPE_DERIVATION_LAW_IDS = \[([\s\S]*?)\] as const/);
const canonicalLaws = [...(canonicalLawBlock?.[1] ?? '').matchAll(/'([a-z_]+)'/g)].map(match => match[1]);
const checks = [
  ['guarded law declaration exists', guardedBlock !== null],
  ['failure mapping exists', failureBlock !== null],
  ['guard declaration includes every law emitted by its own failure mapper', emittedLaws.every(law => guardedLaws.includes(law))],
  ['guard declaration has no duplicate law identifiers', new Set(guardedLaws).size === guardedLaws.length],
  ['all guarded laws belong to canonical upstream law algebra', guardedLaws.every(law => canonicalLaws.includes(law))],
  ['source-domain identity mismatch is declared', guardedLaws.includes('evidence_key_matches_source_domain')],
  ['resource canonical identity mismatch is declared', guardedLaws.includes('resource_identity_is_canonical')],
  ['source inventory mismatch has its own canonical law', guardedLaws.includes('source_evidence_inventory_matches_input') && canonicalLaws.includes('source_evidence_inventory_matches_input')],
  ['source disposition remains owned by judgment closure rather than inventory identity', !guardedLaws.includes('every_source_has_a_disposition')],
  ['duplicate occurrence location law is declared', guardedLaws.includes('all_duplicate_occurrence_locations_are_pairwise_distinct')],
  ['source occurrence key and location laws are declared', guardedLaws.includes('source_occurrence_key_matches_source_coordinates') && guardedLaws.includes('source_occurrence_location_matches_evidence')],
  ['active verifier path has no semantic foundation/relation dependency', !/semantic\/(foundation|relation)/.test(verifier)],
];
let failures = 0;
for (const [label, condition] of checks) {
  console.log(`${condition ? 'PASS' : 'FAIL'} ${label}`);
  if (!condition) failures += 1;
}
const syntax = ts.transpileModule(verifier, { fileName: 'requestTypeDerivationSourceOccurrenceVerification.ts', compilerOptions: { target: ts.ScriptTarget.ES2024, module: ts.ModuleKind.ESNext }, reportDiagnostics: true });
const syntaxErrors = (syntax.diagnostics || []).filter(item => item.category === ts.DiagnosticCategory.Error);
console.log(`${syntaxErrors.length === 0 ? 'PASS' : 'FAIL'} TypeScript syntax transpilation`);
failures += syntaxErrors.length;
console.log(`Phase 2576: ${checks.length + 1 - failures}/${checks.length + 1} assertions passed.`);
process.exitCode = failures ? 1 : 0;
