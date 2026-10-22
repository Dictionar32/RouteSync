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
const mapper = verifier.match(/const toCanonicalFailure = \([\s\S]*?\n};/);
const membershipBlock = verifier.match(/const inputCandidateLocations = \([\s\S]*?\n};/);
const checks = [
  ['canonical law algebra declares source occurrence membership', laws.includes('source_occurrence_belongs_to_input')],
  ['membership law is required by canonical contract', /source_occurrence_belongs_to_input: 'required'/.test(contract)],
  ['guard explicitly owns the membership law', guardLaws.includes('source_occurrence_belongs_to_input')],
  ['membership failure has a typed canonical counterexample', /law: 'source_occurrence_belongs_to_input',[\s\S]*?reason: 'source_occurrence_not_found_in_input'/.test(mapper?.[0] ?? '')],
  ['membership counterexample retains source evidence', /source: violation\.source, candidateLocations: violation\.candidateLocations/.test(mapper?.[0] ?? '')],
  ['candidate locations derive from canonical route identity', /canonicalRouteIdentity\(route\.identity\)\.semanticKey === source\.semanticKey/.test(membershipBlock?.[0] ?? '')],
  ['candidate locations derive from canonical resource identity', /canonicalResourceIdentity\(resource\.definition\.name\)\.semanticKey === source\.semanticKey/.test(membershipBlock?.[0] ?? '')],
  ['candidate locations derive from canonical request identity', /canonicalRequestIdentity\(request\.definition\.identity\)\.semanticKey === source\.semanticKey/.test(membershipBlock?.[0] ?? '')],
  ['membership and location checks share canonical input match', /const memberships = evidence\.map\(source => Object\.freeze\(\{ source, membership: sourceOccurrenceInputMembership\(source, input\) \}\)\)/.test(verifier)],
  ['guard laws all belong to the canonical law algebra', guardLaws.every(law => laws.includes(law))],
  ['active verifier avoids semantic foundation and relation imports', !/semantic\/(foundation|relation)/.test(verifier)],
  ['no legacy solver is introduced into the source occurrence guard', !/requestTypeDerivationSolver/.test(verifier)],
];
let failures = 0;
for (const [label, condition] of checks) {
  process.stdout.write(`${condition ? 'PASS' : 'FAIL'} ${label}\n`);
  if (!condition) failures += 1;
}
for (const relative of [contractPath, verifierPath]) {
  const result = ts.transpileModule(read(relative), {
    fileName: path.basename(relative),
    compilerOptions: { target: ts.ScriptTarget.ES2024, module: ts.ModuleKind.ESNext },
    reportDiagnostics: true,
  });
  const errors = (result.diagnostics ?? []).filter(item => item.category === ts.DiagnosticCategory.Error);
  process.stdout.write(`${errors.length === 0 ? 'PASS' : 'FAIL'} syntax transpilation ${relative}\n`);
  failures += errors.length;
}
process.stdout.write(`Phase 2578: ${checks.length + 2 - failures}/${checks.length + 2} assertions passed.\n`);
process.exitCode = failures === 0 ? 0 : 1;
