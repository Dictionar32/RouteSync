const fs = require('node:fs');
const path = require('node:path');
const root = process.cwd();
const upstreamPath = 'packages/core/src/types/upstream/semanticDataflowKnowledgeValidation.ts';
const facadePath = 'packages/core/src/compiler/frontend/php/routeAst/semanticKnowledgeDataFlowRelations.ts';
const adapterPath = 'packages/core/src/compiler/frontend/php/routeAst/phpAstSemanticKnowledgeDataFlowAdapter.ts';
const barrelPath = 'packages/core/src/types/upstream/index.ts';
const upstream = fs.readFileSync(path.join(root, upstreamPath), 'utf8');
const facade = fs.readFileSync(path.join(root, facadePath), 'utf8');
const adapter = fs.readFileSync(path.join(root, adapterPath), 'utf8');
const barrel = fs.readFileSync(path.join(root, barrelPath), 'utf8');
const checks = [
  ['validation operation is owned by core/types/upstream', /export interface SemanticKnowledgeDataFlowValidationOperationsInterface/.test(upstream) && /export const semanticKnowledgeDataFlowValidationOperations/.test(upstream)],
  ['upstream operation returns a closed typed outcome, not void', /export type SemanticKnowledgeDataFlowValidationOutcome\s*=/.test(upstream) && /kind: 'valid'/.test(upstream) && /kind: 'invalid'/.test(upstream) && !/validate: \(dataFlow: SemanticKnowledgeDataFlow\) => void/.test(upstream)],
  ['domain violations remain closed and explicit', ['duplicate-fact-identity', 'unknown-flow-endpoint', 'self-reference', 'unknown-guard-predicate', 'unsupported-derived-relation'].every(kind => upstream.includes(`kind: '${kind}'`))],
  ['identity invariants use the typed KnowledgeId operation instead of string keys', /semanticKnowledgeIdOperations\.same/.test(upstream) && !/knowledgeIdKey/.test(upstream) && /readonly identities: readonly KnowledgeId\[\]/.test(upstream)],
  ['compiler facade delegates validation upstream', /semanticKnowledgeDataFlowValidationOperations\.validate\(dataFlow\)/.test(facade)],
  ['facade preserves the scanner extension model in the outcome', /kind: 'valid', dataFlow/.test(facade) && /kind: 'invalid', dataFlow, violations: outcome\.violations/.test(facade)],
  ['runtime producer still consumes the validation outcome', /semanticKnowledgeDataFlowWiring\.continueAfterValidation\(validateSemanticKnowledgeDataFlow\(model\)\)/.test(adapter)],
  ['upstream barrel exports the validation operation', /export \* from '\.\/semanticDataflowKnowledgeValidation'/.test(barrel)],
  ['deleted relation foundations remain absent', ['relationMembership.ts', 'relationalSequence.ts', 'semanticRelations.ts', 'semanticRelationalCollections.ts'].every(name => !fs.existsSync(path.join(root, 'packages/core/src/semantic/relations', name)))],
  ['collections invariant remains one newline byte', fs.readFileSync(path.join(root, 'packages/core/src/types/upstream/collections.ts')).equals(Buffer.from('\n'))],
];
const results = checks.map(([name, pass]) => ({ name, pass }));
const report = { phase: 3055, title: 'Upstream semantic validation domain ownership', passed: results.filter(result => result.pass).length, total: results.length, status: results.every(result => result.pass) ? 'PASS' : 'FAIL', results };
console.log(JSON.stringify(report, null, 2));
if (report.status !== 'PASS') process.exitCode = 1;
