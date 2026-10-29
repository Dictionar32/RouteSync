const fs = require('node:fs');
const path = require('node:path');
const root = process.cwd();
const validationPath = 'packages/core/src/compiler/frontend/php/routeAst/semanticKnowledgeDataFlowRelations.ts';
const upstreamValidationPath = 'packages/core/src/types/upstream/semanticDataflowKnowledgeValidation.ts';
const adapterPath = 'packages/core/src/compiler/frontend/php/routeAst/phpAstSemanticKnowledgeDataFlowAdapter.ts';
const validation = fs.readFileSync(path.join(root, validationPath), 'utf8');
const upstreamValidation = fs.readFileSync(path.join(root, upstreamValidationPath), 'utf8');
const adapter = fs.readFileSync(path.join(root, adapterPath), 'utf8');
const checks = [
  ['validation exposes a closed typed outcome', /export type SemanticKnowledgeDataFlowValidation\s*=/.test(validation) && /kind: 'valid'/.test(validation) && /kind: 'invalid'/.test(validation)],
  ['violations are modeled as domain cases', /export type SemanticKnowledgeDataFlowViolation\s*=/.test(validation) && ['duplicate-fact-identity', 'unknown-flow-endpoint', 'self-reference', 'unknown-guard-predicate', 'unsupported-derived-relation'].every(kind => upstreamValidation.includes(`kind: '${kind}'`))],
  ['validate no longer returns void', /readonly validate: \(dataFlow: SemanticKnowledgeDataFlow\) => SemanticKnowledgeDataFlowValidation/.test(validation)],
  ['validation result has an explicit domain continuation', /readonly continueAfterValidation: \(validation: SemanticKnowledgeDataFlowValidation\) => SemanticKnowledgeDataFlow/.test(validation)],
  ['runtime producer consumes the validation outcome', /semanticKnowledgeDataFlowWiring\.continueAfterValidation\(validateSemanticKnowledgeDataFlow\(model\)\)/.test(adapter)],
  ['deleted relation foundations remain absent', ['relationMembership.ts', 'relationalSequence.ts', 'semanticRelations.ts', 'semanticRelationalCollections.ts'].every(name => !fs.existsSync(path.join(root, 'packages/core/src/semantic/relations', name)))],
  ['collections invariant remains one newline byte', fs.readFileSync(path.join(root, 'packages/core/src/types/upstream/collections.ts')).equals(Buffer.from('\n'))],
];
const results = checks.map(([name, pass]) => ({ name, pass }));
const report = { phase: 3054, title: 'Semantic validation outcome ADT', passed: results.filter(result => result.pass).length, total: results.length, status: results.every(result => result.pass) ? 'PASS' : 'FAIL', results };
console.log(JSON.stringify(report, null, 2));
if (report.status !== 'PASS') process.exitCode = 1;
