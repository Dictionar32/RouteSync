const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '../..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const checks = [
  ['interface contract advanced to version 37', /readonly version: 37;/.test(read('packages/core/src/types/upstream/invocationSemanticJudgmentInterface.ts')) && /version: 37,/.test(read('packages/core/src/types/upstream/invocationSemanticJudgmentInterface.ts'))],
  ['interface declares invocation-shape invariant', /invocationShape: 'same-identity-requires-equal-receiver-operation-ordered-arguments-and-source-provenance'/.test(read('packages/core/src/types/upstream/invocationSemanticJudgmentInterface.ts'))],
  ['authority defines structural invocation identity', /const invocationShapeKey =/.test(read('packages/core/src/types/upstream/invocationSemanticJudgmentAuthority.ts'))],
  ['authority rejects same-ID conflicting source knowledge', /requested invocation reuses a knowledge identity with different receiver, operation, ordered arguments, or source provenance/.test(read('packages/core/src/types/upstream/invocationSemanticJudgmentAuthority.ts'))],
  ['unproven obligation must preserve exact invocation shape', /obligation does not preserve the exact requested invocation/.test(read('packages/core/src/types/upstream/invocationSemanticJudgmentAuthority.ts'))],
  ['regression test covers conflicting same-ID invocation shape', /rejects a requested invocation that reuses a knowledge identity with altered semantic shape/.test(read('packages/core/src/types/upstream/__tests__/invocation-semantic-algebra.phase1677.test.ts'))],
  ['regression test covers conflicting obligation shape', /rejects an unproven-evidence obligation whose invocation shape differs despite sharing identity/.test(read('packages/core/src/types/upstream/__tests__/invocation-semantic-algebra.phase1677.test.ts'))],
  ['Laravel scanner consumes integrated response projection', /invocationSemanticIntegratedResponseComposition\.integrate/.test(read('packages/core/src/compiler/scanner/lexer/controllerDataflowAnalyzer.ts')) && /invocationSemanticIntegratedResponseAnalysisProjection\.project/.test(read('packages/core/src/compiler/scanner/lexer/controllerDataflowAnalyzer.ts'))],
];

let failures = 0;
for (const [label, passed] of checks) {
  process.stdout.write(`${passed ? 'PASS' : 'FAIL'} ${label}\n`);
  failures += Number(!passed);
}
process.stdout.write(`Phase 1756 audit: ${checks.length - failures}/${checks.length} passed\n`);
process.exitCode = failures === 0 ? 0 : 1;
