const fs = require('node:fs');
const path = require('node:path');
const root = process.cwd();
const continuationPath = 'packages/core/src/types/upstream/semanticDataflowKnowledgeContinuation.ts';
const validationPath = 'packages/core/src/types/upstream/semanticDataflowKnowledgeValidation.ts';
const facadePath = 'packages/core/src/compiler/frontend/php/routeAst/semanticKnowledgeDataFlowRelations.ts';
const barrelPath = 'packages/core/src/types/upstream/index.ts';
const continuation = fs.readFileSync(path.join(root, continuationPath), 'utf8');
const validation = fs.readFileSync(path.join(root, validationPath), 'utf8');
const facade = fs.readFileSync(path.join(root, facadePath), 'utf8');
const barrel = fs.readFileSync(path.join(root, barrelPath), 'utf8');
const checks = [
  ['continuation is a closed ADT with continue and blocked cases', /export type SemanticKnowledgeDataFlowContinuationOutcome\s*=/.test(continuation) && /kind: 'continue'/.test(continuation) && /kind: 'blocked'/.test(continuation)],
  ['blocked outcome preserves the canonical data-flow model and typed violations', /readonly dataFlow: SemanticKnowledgeDataFlow/.test(continuation) && /readonly violations: readonly SemanticKnowledgeDataFlowValidationViolation\[\]/.test(continuation)],
  ['upstream owns an interface-typed continuation operation', /export interface SemanticKnowledgeDataFlowContinuationOperationsInterface/.test(continuation) && /export const semanticKnowledgeDataFlowContinuationOperations:\s*SemanticKnowledgeDataFlowContinuationOperationsInterface/.test(continuation)],
  ['upstream continuation does not throw or return void', !/\bthrow\b/.test(continuation) && !/continueAfterValidation\s*:\s*\([^)]*\)\s*=>\s*void/.test(continuation)],
  ['continuation discriminates on the validation ADT and preserves both outcomes', /validation\.kind === 'valid'/.test(continuation) && /validation\.dataFlow/.test(continuation) && /validation\.violations/.test(continuation)],
  ['compatibility facade exposes the typed continuation outcome', /readonly continueWithOutcome: \(validation: SemanticKnowledgeDataFlowValidation\) => SemanticKnowledgeDataFlowContinuationOutcome/.test(facade) && /semanticKnowledgeDataFlowContinuationOperations\.continueAfterValidation\(validation\)/.test(facade)],
  ['upstream barrel exports continuation operations', /export \* from '\.\/semanticDataflowKnowledgeContinuation'/.test(barrel)],
  ['validation source remains the closed typed ADT', /SemanticKnowledgeDataFlowValidationOutcome/.test(validation) && /kind: 'invalid'/.test(validation)],
  ['deleted relation foundations remain absent', ['relationMembership.ts', 'relationalSequence.ts', 'semanticRelations.ts', 'semanticRelationalCollections.ts'].every(name => !fs.existsSync(path.join(root, 'packages/core/src/semantic/relations', name)))],
  ['collections invariant remains exactly one newline byte', fs.readFileSync(path.join(root, 'packages/core/src/types/upstream/collections.ts')).equals(Buffer.from('\n'))],
];
const results = checks.map(([name, pass]) => ({ name, pass }));
const report = { phase: 3056, title: 'Typed semantic validation continuation', passed: results.filter(result => result.pass).length, total: results.length, status: results.every(result => result.pass) ? 'PASS' : 'FAIL', results };
console.log(JSON.stringify(report, null, 2));
if (report.status !== 'PASS') process.exitCode = 1;
