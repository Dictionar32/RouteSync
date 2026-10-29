const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const authority = read('packages/core/src/types/upstream/controllerDataflowSemanticJudgmentAuthority.ts');
const authorityInterface = read('packages/core/src/types/upstream/controllerDataflowSemanticJudgmentAuthorityInterface.ts');
const model = read('packages/core/src/types/upstream/controllerDataflowInvocationSemanticModelInterface.ts');
const scanner = read('packages/core/src/types/upstream/laravelControllerScannerInterface.ts');
const analyzer = read('packages/core/src/compiler/frontend/php/controllerDataflowAnalyzer.ts');
const sourceIdentity = read('packages/core/src/types/upstream/sourceProjectIdentity.ts');
const packageJson = JSON.parse(read('package.json'));
const checks = [
  ['authority reuses the canonical upstream source identity semantics', /import \{ laravelSourceIdentitySemantics \} from '\.\/sourceProjectIdentity'/.test(authority) && /readonly relateSourceFiles:/.test(sourceIdentity)],
  ['authority checks invocation judgment source against the canonical subject', /requireSameSourceFileIdentity\(sourceCorrelation\.sourceFile, sourceCorrelation\.invocationJudgment\.sourceFile\)/.test(authority)],
  ['authority checks knowledge projection source against the canonical subject', /requireSameSourceFileIdentity\(sourceCorrelation\.sourceFile, sourceCorrelation\.semanticKnowledgeProjection\.sourceFile\)/.test(authority)],
  ['identity mismatch is rejected before knowledge binding or integrated-response composition', authority.indexOf('requireSameSourceFileIdentity(sourceCorrelation.sourceFile, sourceCorrelation.semanticKnowledgeProjection.sourceFile)') < authority.indexOf('const knowledge = sourceCorrelation.semanticKnowledgeProjection.knowledge') && authority.indexOf('requireSameSourceFileIdentity(sourceCorrelation.sourceFile, sourceCorrelation.semanticKnowledgeProjection.sourceFile)') < authority.indexOf('invocationSemanticIntegratedResponseComposition.integrate')],
  ['identity relation is narrowed through a typed same-source-file judgment', /Extract<typeof identityJudgment, \{ readonly kind: 'same_source_file_identity' \}>/.test(authority) && /relationRefine\(/.test(authority)],
  ['authority contract describes source identity closure', /readonly sourceIdentityClosure:/.test(authorityInterface) && /malformed-correlation-is-rejected-before-semantic-closure/.test(authorityInterface)],
  ['semantic model contract documents validated source identity', /readonly version: 11/.test(model) && /every-statement-payload-source-span/.test(model)],
  ['scanner contract reflects upstream identity closure without adding scanner-side reasoning', /readonly version: 101/.test(scanner) && /upstream-validates-canonical-sourceFile/.test(scanner) && !/requireSameSourceFileIdentity/.test(analyzer)],
  ['scanner continues to forward one source-correlation bundle', /sourceCorrelation:\s*\{\s*kind: 'controller_dataflow_source_correlation',\s*sourceFile,\s*invocationJudgment: judgment,\s*semanticKnowledgeProjection,\s*statementPayloads,/s.test(analyzer)],
  ['authority contract versions are coherent', /readonly contractVersion: 13/.test(authorityInterface) && /readonly version: 13/.test(authorityInterface) && /contractVersion: 13,/.test(authority)],
  ['audit command is registered', Boolean(packageJson.scripts['audit:phase1934-controller-source-identity-closure-interface-first'])],
  ['no new type assertions or semantic-foundation dependency', !/\sas\s/.test(authority) && !/semantic\/foundation/.test([authority, authorityInterface, model, scanner].join('\n'))],
];
let failures = 0;
for (const [name, passed] of checks) {
  process.stdout.write(`${passed ? 'PASS' : 'FAIL'} ${name}\n`);
  failures += Number(!passed);
}
process.stdout.write(`${checks.length - failures}/${checks.length} checks passed\n`);
process.exitCode = failures === 0 ? 0 : 1;
