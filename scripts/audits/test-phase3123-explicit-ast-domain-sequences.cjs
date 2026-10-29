'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '../..');
const astPath = path.join(root, 'packages/core/src/types/upstream/ast.ts');
const semanticPath = path.join(root, 'packages/core/src/types/upstream/astSemanticInterface.ts');
const ast = fs.readFileSync(astPath, 'utf8');
const semantic = fs.readFileSync(semanticPath, 'utf8');
const checks = [];
const check = (label, assertion) => { assertion(); checks.push(label); };

check('generic AstSequence<T> is retired', () => {
  assert.doesNotMatch(ast + '\n' + semantic, /\bAstSequence\s*</);
  assert.doesNotMatch(ast + '\n' + semantic, /AstSequenceFactoryInterface/);
});
check('sequence payloads have explicit domain types', () => {
  for (const type of [
    'AstEvidenceFactSequence', 'AstConstraintSequence', 'AstDependencySequence',
    'AstWitnessNameSequence', 'AstStringValueSequence', 'AstDiagnosticSequence',
    'AstProofPremiseSequence', 'AstRelationFactSequence', 'ControllerMethodSequence',
  ]) assert.match(ast, new RegExp(`export type ${type}\\s*=`));
});
check('domain sequence operations have an explicit interface', () => {
  assert.match(ast, /export interface AstSequenceOperationsInterface\s*\{/);
  assert.match(ast, /export const astSequenceOperations:\s*AstSequenceOperationsInterface\s*=\s*Object\.freeze\(/);
});
check('relation facts use their own typed sequence', () => {
  assert.match(ast, /export type AstRelationFacts\s*=\s*\{[\s\S]*?items:\s*AstRelationFactSequence/);
  assert.match(ast, /emptyRelationFacts:\s*\(\)\s*=>\s*AstRelationFactSequence/);
  assert.match(ast, /consRelationFact:\s*\(head:\s*AstRelationFact,\s*tail:\s*AstRelationFactSequence\)/);
});
check('proof premises and evidence facts retain typed payloads', () => {
  assert.match(ast, /premises:\s*AstProofPremiseSequence/);
  assert.match(ast, /facts:\s*AstEvidenceFactSequence/);
  assert.match(ast, /consProofPremiseWithEmptyTail:\s*\(head:\s*AstProofPremise\)/);
  assert.match(ast, /consEvidenceFactWithEmptyTail:\s*\(head:\s*AstEvidenceFact\)/);
});
check('AST construction calls explicit domain operations without generic arguments', () => {
  assert.match(ast, /astSequenceOperations\.consEvidenceFactWithEmptyTail\(/);
  assert.match(ast, /astSequenceOperations\.consRelationFact\(/);
  assert.match(ast, /astSequenceOperations\.emptyConstraints\(\)/);
  assert.match(ast, /astSequenceOperations\.emptyDependencies\(\)/);
  assert.doesNotMatch(ast, /astSequenceOperations\.[A-Za-z]+\s*<[^>]+>/);
});
check('semantic bridge is specialized to relation facts', () => {
  assert.match(semantic, /export interface AstSemanticRelationSequenceFactoryInterface\s*\{/);
  assert.match(semantic, /export const astSemanticRelationSequenceFactory:\s*AstSemanticRelationSequenceFactoryInterface\s*=\s*Object\.freeze\(/);
  assert.match(semantic, /sequence:\s*AstRelationFactSequence/);
  assert.doesNotMatch(semantic, /AstSemanticSequenceFactoryInterface|astSemanticSequenceFactory\b/);
});
check('deleted relation foundation modules are not recreated by this migration', () => {
  for (const moduleName of ['relationMembership.ts', 'relationalSequence.ts', 'semanticRelations.ts']) {
    assert.equal(fs.existsSync(path.join(root, 'packages/core/src/semantic/relations', moduleName)), false);
  }
  assert.doesNotMatch(ast, /from ['"].*semantic\/relations\/(relationMembership|relationalSequence|semanticRelations)['"]/);
});
check('existing AST derivation operation remains interface-owned', () => {
  assert.match(ast, /export interface AstDerivationFactoryInterface\s*\{/);
  assert.match(ast, /export const astDerivationFactory:\s*AstDerivationFactoryInterface\s*=\s*Object\.freeze\(/);
  assert.match(ast, /astDerivationFactory\.step\(\{/);
});

const reportPath = path.join(root, 'reports/PHASE3123_EXPLICIT_AST_DOMAIN_SEQUENCES.json');
fs.mkdirSync(path.dirname(reportPath), { recursive: true });
fs.writeFileSync(reportPath, `${JSON.stringify({
  phase: 3123,
  subject: 'Explicit typed AST domain sequences; generic sequence factory retired',
  checksPassed: checks.length,
  checksFailed: 0,
  checks,
}, null, 2)}\n`);
console.log(`Phase 3123 explicit AST domain sequences: ${checks.length}/${checks.length} checks passed`);
for (const label of checks) console.log(`PASS ${label}`);
console.log(`Report: ${path.relative(root, reportPath)}`);
