const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const root = path.resolve(__dirname, '../..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const contractPath = 'packages/core/src/types/upstream/requestTypeDerivationInterface.ts';
const verifierPath = 'packages/core/src/compiler/semantic/request-type-derivation/requestTypeDerivationSourceOccurrenceVerification.ts';
const contract = read(contractPath);
const verifier = read(verifierPath);
const lawBlock = contract.match(/export const REQUEST_TYPE_DERIVATION_LAW_IDS = \[([\s\S]*?)\] as const/);
const laws = [...(lawBlock?.[1] ?? '').matchAll(/'([a-z_]+)'/g)].map(match => match[1]);
const guardBlock = verifier.match(/const SOURCE_OCCURRENCE_LAWS:[\s\S]*?\]\);/);
const guardLaws = [...(guardBlock?.[0] ?? '').matchAll(/'([a-z_]+)'/g)].map(match => match[1]);
const mappingBlock = verifier.match(/const toCanonicalFailure = \([\s\S]*?\n};/);
const checks = [
  ['canonical law algebra declares source inventory equality', laws.includes('source_evidence_inventory_matches_input')],
  ['canonical law registry has no duplicate IDs', new Set(laws).size === laws.length],
  ['canonical contract requires the inventory equality law', /source_evidence_inventory_matches_input: 'required'/.test(contract)],
  ['inventory mismatch maps to its own law', /law: 'source_evidence_inventory_matches_input',[\s\S]*?reason: 'source_inventory_mismatch'/.test(mappingBlock?.[0] ?? '')],
  ['inventory mismatch no longer claims every source has a disposition', !/law: 'every_source_has_a_disposition',[\s\S]*?reason: 'source_inventory_mismatch'/.test(mappingBlock?.[0] ?? '')],
  ['guard declares every law it emits', [...new Set([...(mappingBlock?.[0] ?? '').matchAll(/law: '([a-z_]+)'/g)].map(match => match[1]))].every(law => guardLaws.includes(law))],
  ['guard law IDs all belong to canonical upstream law algebra', guardLaws.every(law => laws.includes(law))],
  ['every-source disposition law remains a separate canonical obligation', laws.includes('every_source_has_a_disposition') && !guardLaws.includes('every_source_has_a_disposition')],
  ['source inventory failure retains expected and actual domain keys', /expectedKeys: violation\.expectedKeys, actualKeys: violation\.actualKeys/.test(verifier)],
  ['active guard avoids semantic foundation and relation imports', !/semantic\/(foundation|relation)/.test(verifier)],
];
let failures = 0;
for (const [label, condition] of checks) {
  process.stdout.write(`${condition ? 'PASS' : 'FAIL'} ${label}\n`);
  if (!condition) failures += 1;
}
for (const relative of [contractPath, verifierPath]) {
  const syntax = ts.transpileModule(read(relative), {
    fileName: path.basename(relative),
    compilerOptions: { target: ts.ScriptTarget.ES2024, module: ts.ModuleKind.ESNext },
    reportDiagnostics: true,
  });
  const errors = (syntax.diagnostics ?? []).filter(item => item.category === ts.DiagnosticCategory.Error);
  process.stdout.write(`${errors.length === 0 ? 'PASS' : 'FAIL'} syntax transpilation ${relative}\n`);
  failures += errors.length;
}
process.stdout.write(`Phase 2577: ${checks.length + 2 - failures}/${checks.length + 2} assertions passed.\n`);
process.exitCode = failures === 0 ? 0 : 1;
