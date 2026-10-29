const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = (p) => fs.readFileSync(path.join(root, p), 'utf8');
const proof = read('packages/core/src/types/upstream/astSemanticStageProof.ts');
const authority = read('packages/core/src/types/upstream/astSemanticStageAuthority.ts');
const mapping = read('packages/core/src/types/upstream/resourceSemanticMappingAlgebra.ts');
const pkg = JSON.parse(read('package.json'));
const collections = fs.statSync(path.join(root, 'packages/core/src/types/upstream/collections.ts')).size;
const checks = [
  ['exports typed proof operations contract', /export interface AstSemanticStageProofOperationsInterface/.test(proof)],
  ['exports interface-first frozen operation object', /export const astSemanticStageProofOperations:\s*AstSemanticStageProofOperationsInterface\s*=\s*Object\.freeze/.test(proof)],
  ['operation exposes proof resolution', /readonly resolve:/.test(proof)],
  ['operation exposes actionable obligations', /readonly obligations:/.test(proof)],
  ['operation exposes stage continuation', /readonly continueFrom:/.test(proof)],
  ['legacy standalone proof exports removed', !/export const stageProof\s*=|export const stageProofObligations\s*=|export const stageProofInput\s*=/.test(proof)],
  ['stage authority consumes operation object', /astSemanticStageProofOperations\.obligations\(/.test(authority)],
  ['resource mapping consumes operation object', /astSemanticStageProofOperations\.resolve\(/.test(mapping)],
  ['phase audit registered', typeof pkg.scripts['audit:phase2847-ast-semantic-stage-proof-operations'] === 'string'],
  ['upstream collections remains empty', collections === 0],
];
let failures = 0;
for (const [name, ok] of checks) { console.log(`${ok ? 'PASS' : 'FAIL'} ${name}`); if (!ok) failures++; }
console.log(`\n${checks.length - failures}/${checks.length} checks passed`);
process.exitCode = failures ? 1 : 0;
