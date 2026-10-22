const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = (relativePath) => fs.readFileSync(path.join(root, relativePath), 'utf8');
const contract = read('packages/core/src/types/upstream/laravelControllerInvocationSemanticJudgmentInterface.ts');
const authority = read('packages/core/src/types/upstream/laravelControllerInvocationSemanticJudgmentAuthority.ts');
const projection = read('packages/core/src/types/upstream/laravelControllerAstProjectionSemanticAuthority.ts');
const projectionTest = read('packages/core/src/types/upstream/__test__/laravelControllerAstProjectionSemanticAuthority.phase1952.test.ts');
const scanner = read('packages/core/src/compiler/scanner/wiring/laravelControllerScanner.ts');
const scannerTypes = read('packages/core/src/types/upstream/laravelControllerScannerInterface.ts');
const checks = [
  ['judgment interface module contains no runtime contract constant or Object.freeze value', !/\bexport const\b|Object\.freeze\s*\(/.test(contract)],
  ['judgment interface module no longer declares a semantic reasoning-rule ADT', !/LaravelControllerInvocationSemanticReasoningRule|LaravelControllerInvocationSemanticReasoningContract|SEMANTIC_REASONING_CONTRACT/.test(contract)],
  ['judgment contract contains only structural contract metadata', /readonly judgmentShape: 'closed_discriminated_union'/.test(contract) && /readonly sourceIdentity: 'canonical_source_file_on_judgment'/.test(contract) && /readonly responseCorrelation: 'integrated_response_indexed_by_exact_invocation_judgment'/.test(contract) && !/readonly reasoning:|Rule:|readonly rules:/.test(contract)],
  ['runtime contract value is owned by the existing authority implementation', /export const LARAVEL_CONTROLLER_INVOCATION_SEMANTIC_JUDGMENT_CONTRACT/.test(authority) && /version: 13/.test(authority)],
  ['invocation authority composes the upstream binding and integration judgments directly', /this\.dependencies\.sourceBinding\.bind/.test(authority) && /this\.dependencies\.integration\.project/.test(authority) && !/SEMANTIC_REASONING_CONTRACT/.test(authority)],
  ['AST projection interface no longer exposes a reasoning-rule value', !/readonly reasoning:|SemanticReasoningRule/.test(contract)],
  ['AST projection executor dispatches on the closed context discriminant', /case 'syntax_only'/.test(projection) && /case 'invocation_semantic_judgment'/.test(projection) && /case 'integrated_invocation_response_judgment'/.test(projection) && !/\.reasoning\b/.test(projection)],
  ['AST projection preserves the exact upstream invocation judgment', /invocationJudgment: context\.judgment/.test(projection)],
  ['integrated AST projection preserves the exact response judgment without reconstruction', /responseJudgment: context\.responseJudgment/.test(projection)],
  ['scanner artifact ADT remains explicit and outcome-correlated', /LaravelControllerInvocationNotConnectedJudgment/.test(scannerTypes) && /LaravelControllerInvocationSourceBindingRejectedJudgment/.test(scannerTypes) && /LaravelControllerInvocationCompleteJudgment/.test(scannerTypes) && /LaravelControllerInvocationBlockedJudgment/.test(scannerTypes)],
  ['runtime scanner relation and subscanner dependencies are visible and unchanged', /semantic\/relations/.test(scanner) && /scanControllerAction/.test(scanner)],
];
let failures = 0;
for (const [label, passed] of checks) {
  process.stdout.write(`${passed ? 'PASS' : 'FAIL'} ${label}\n`);
  failures += passed ? 0 : 1;
}
process.stdout.write(`RESULT ${checks.length - failures}/${checks.length}\n`);
process.exitCode = failures === 0 ? 0 : 1;
