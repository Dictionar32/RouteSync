const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '../..');
const read = (relative) => fs.readFileSync(path.join(root, relative), 'utf8');
const contract = read('packages/core/src/types/upstream/invocationSemanticJudgmentInterface.ts');
const authority = read('packages/core/src/types/upstream/invocationSemanticJudgmentAuthority.ts');
const algebra = read('packages/core/src/types/upstream/invocationSemanticJudgmentAlgebra.ts');
const pipeline = read('packages/core/src/types/upstream/invocationSemanticPipeline.ts');
const scanner = read('packages/core/src/compiler/scanner/lexer/controllerDataflowAnalyzer.ts');

assert.match(contract, /readonly version: 36;/);
assert.match(contract, /readonly positionalArgumentEvidence: 'required-explicit-upstream-judgment-must-match-exact-invocation-and-ordered-arguments'/);
assert.match(contract, /readonly positionalEvidenceIdentity: 'reject-foreign-invocation-or-argument-sequence-before-semantic-derivation'/);
assert.match(contract, /readonly positionalEvidence: InvocationPositionalEvidenceInput;/);
assert.doesNotMatch(contract, /InvocationPositionalArgumentEvidence\s*\|\s*null/);

assert.match(authority, /export const assertInvocationSemanticInputContract = \(input: InvocationSemanticInput\)/);
assert.match(authority, /positional evidence belongs to another invocation/);
assert.match(authority, /positional evidence does not cover the exact ordered invocation arguments/);
assert.match(authority, /positional-evidence obligation belongs to another invocation/);
assert.match(authority, /const validatedInput = assertInvocationSemanticInputContract\(input\)/);
assert.match(authority, /analyzeInvocationJudgmentAlgebra\(validatedInput\.knowledge, validatedInput\.invocation, validatedInput\.positionalEvidence\)/);

assert.match(algebra, /deriveInvocationJudgment\(\s*knowledge, invocation, invocationPositionalEvidenceUnproven\(invocation\)/);
assert.doesNotMatch(algebra, /deriveInvocationJudgment\([^;]*\bnull\b/s);
assert.match(pipeline, /publicationAuthority\.publish\(\{ inventory, analysis \}\)/);
assert.match(pipeline, /kind: 'validated-integrated-response'/);
assert.match(pipeline, /kind: 'rejected-integrated-response'/);
assert.match(scanner, /invocationSemanticIntegratedResponseComposition\.integrate\(\{ knowledge: semanticKnowledgeDataFlow \}\)/);
assert.match(scanner, /invocationSemanticIntegratedResponseAnalysisProjection\.project\(/);

console.log('phase1755-invocation-input-interface-contract: 18 assertions passed');
