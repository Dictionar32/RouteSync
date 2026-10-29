const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const authority = read('packages/core/src/types/upstream/controllerDataflowSemanticJudgmentAuthority.ts');
const contract = read('packages/core/src/types/upstream/controllerDataflowSemanticJudgmentAuthorityInterface.ts');
const model = read('packages/core/src/types/upstream/controllerDataflowInvocationSemanticModelInterface.ts');
const scanner = read('packages/core/src/types/upstream/laravelControllerScannerInterface.ts');
const analyzer = read('packages/core/src/compiler/frontend/php/controllerDataflowAnalyzer.ts');
const sourceIdentity = read('packages/core/src/types/upstream/sourceProjectIdentity.ts');
const packageJson = JSON.parse(read('package.json'));
const checks = [
  ['authority reuses the canonical source-file identity relation', /laravelSourceIdentitySemantics\.relateSourceFiles/.test(authority) && /readonly relateSourceFiles:/.test(sourceIdentity)],
  ['invocation judgment and knowledge projection identities are validated first', /requireSameSourceFileIdentity\(sourceCorrelation\.sourceFile, sourceCorrelation\.invocationJudgment\.sourceFile\)/.test(authority) && /requireSameSourceFileIdentity\(sourceCorrelation\.sourceFile, sourceCorrelation\.semanticKnowledgeProjection\.sourceFile\)/.test(authority)],
  ['every payload source span file is validated against the canonical source', /sourceCorrelation\.statementPayloads\.forEach\(payload =>\s*requireSameSourceFileIdentity\(sourceCorrelation\.sourceFile, payload\.source\.file\)/s.test(authority)],
  ['payload identity validation precedes binding correspondence and integrated response composition', authority.indexOf('sourceCorrelation.statementPayloads.forEach') < authority.indexOf('const bindings =') && authority.indexOf('sourceCorrelation.statementPayloads.forEach') < authority.indexOf('invocationSemanticIntegratedResponseComposition.integrate')],
  ['authority contract declares payload source identity closure', /readonly payloadSourceIdentityClosure:/.test(contract) && /every-statement-payload-source-span-file-must-relate-to-the-canonical-sourceFile/.test(contract)],
  ['semantic model contract includes every payload source span', /readonly version: 11/.test(model) && /every-statement-payload-source-span/.test(model)],
  ['scanner only forwards evidence and does not own identity validation', /readonly version: 101/.test(scanner) && /every-payload-source-span/.test(scanner) && !/requireSameSourceFileIdentity/.test(analyzer)],
  ['authority and scanner contract versions are coherent', /readonly contractVersion: 13/.test(contract) && /readonly version: 13/.test(contract) && /contractVersion: 13,/.test(authority) && /readonly version: 101/.test(scanner) && /version: 101,/.test(scanner)],
  ['audit command is registered', Boolean(packageJson.scripts['audit:phase1935-controller-payload-source-identity-closure-interface-first'])],
  ['no type assertions or semantic-foundation dependency added', !/\sas\s/.test(authority) && !/semantic\/foundation/.test([authority, contract, model, scanner].join('\n'))],
];
let failures = 0;
for (const [name, passed] of checks) {
  process.stdout.write(`${passed ? 'PASS' : 'FAIL'} ${name}\n`);
  failures += Number(!passed);
}
process.stdout.write(`${checks.length - failures}/${checks.length} checks passed\n`);
process.exitCode = failures === 0 ? 0 : 1;
