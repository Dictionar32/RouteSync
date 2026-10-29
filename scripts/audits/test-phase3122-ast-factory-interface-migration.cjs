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

const check = (label, assertion) => {
  assertion();
  checks.push(label);
};

check('AST sequence factory has an explicit interface', () => {
  assert.match(ast, /export interface AstSequenceOperationsInterface\s*\{/);
  assert.match(ast, /export const astSequenceOperations:\s*AstSequenceOperationsInterface\s*=\s*Object\.freeze\(/);
});
check('sequence empty construction is a named domain operation', () => {
  assert.match(ast, /emptyRelationFacts:\s*\(\) => AstRelationFactSequence/);
  assert.match(ast, /emptyRelationFacts:\s*\(\): AstRelationFactSequence => Object\.freeze\(/);
});
check('sequence cons requires an explicit tail', () => {
  assert.match(ast, /consRelationFact:\s*\(head: AstRelationFact, tail: AstRelationFactSequence\) => AstRelationFactSequence/);
  assert.match(ast, /consRelationFact:\s*\(head: AstRelationFact, tail: AstRelationFactSequence\): AstRelationFactSequence => Object\.freeze\(/);
});
check('empty-tail construction is explicit rather than a default parameter', () => {
  assert.match(ast, /consRelationFactWithEmptyTail:\s*\(head: AstRelationFact\) => AstRelationFactSequence/);
  assert.doesNotMatch(ast, /astSequenceCons\s*=\s*<T>\([^)]*=\s*emptyAstSequence/);
});
check('derivation construction has an explicit interface', () => {
  assert.match(ast, /export interface AstDerivationFactoryInterface\s*\{/);
  assert.match(ast, /export const astDerivationFactory:\s*AstDerivationFactoryInterface\s*=\s*Object\.freeze\(/);
});
check('derivation step receives a complete typed input datum', () => {
  assert.match(ast, /export interface AstDerivationStepInput\s*\{/);
  for (const field of ['rule', 'conclusion', 'witness', 'premises', 'round', 'tail']) {
    assert.match(ast, new RegExp(`readonly ${field}:`));
  }
});
check('AST construction uses the interface-owned sequence factory', () => {
  assert.match(ast, /astSequenceOperations\.consRelationFactWithEmptyTail\(/);
  assert.match(ast, /astSequenceOperations\.consRelationFact\(/);
  assert.match(ast, /astSequenceOperations\.emptyConstraints\(\)/);
});
check('AST construction uses the interface-owned derivation factory', () => {
  assert.match(ast, /astDerivationFactory\.step\(\{/);
});
check('semantic sequence bridge is also interface-owned', () => {
  assert.match(semantic, /export interface AstSemanticRelationSequenceFactoryInterface\s*\{/);
  assert.match(semantic, /export const astSemanticRelationSequenceFactory:\s*AstSemanticRelationSequenceFactoryInterface\s*=\s*Object\.freeze\(/);
});
check('legacy direct factory exports and call sites are retired', () => {
  for (const legacy of ['emptyAstSequence', 'astSequenceCons', 'emptyAstDerivation', 'astDerivationStep', 'emptyAstSemanticSequence', 'astSemanticSequenceCons']) {
    assert.doesNotMatch(ast + '\n' + semantic, new RegExp(`\\b${legacy}\\b`));
  }
});
check('semantic barrel exports the factory object, not old direct wrappers', () => {
  assert.match(ast, /astSemanticRelationSequenceFactory,/);
  assert.doesNotMatch(ast, /emptyAstSemanticSequence|astSemanticSequenceCons/);
});

const reportPath = path.join(root, 'reports/PHASE3122_AST_FACTORY_INTERFACE_MIGRATION.json');
fs.mkdirSync(path.dirname(reportPath), { recursive: true });
fs.writeFileSync(reportPath, `${JSON.stringify({ phase: 3122, subject: 'AST factory interface migration', checksPassed: checks.length, checksFailed: 0, checks }, null, 2)}\n`);

console.log(`Phase 3122 AST factory interface migration: ${checks.length}/${checks.length} checks passed`);
for (const label of checks) console.log(`PASS ${label}`);
console.log(`Report: ${path.relative(root, reportPath)}`);
