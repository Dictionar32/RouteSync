const fs = require('node:fs');
const path = require('node:path');
const root = process.cwd();
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const outcome = read('packages/core/src/types/upstream/controllerDataflowAnalysisOutcomeInterface.ts');
const analyzer = read('packages/core/src/compiler/frontend/php/controllerDataflowAnalyzer.ts');
const binding = read('packages/core/src/compiler/scanner/wiring/controllerVariableSemanticRuntimeBinding.ts');
const bodyTypes = read('packages/core/src/compiler/frontend/php/controllerBodyAstTypes.ts');
const parser = read('packages/core/src/compiler/frontend/php/controllerBodyParser.ts');
const index = read('packages/core/src/types/upstream/index.ts');
const packageJson = JSON.parse(read('package.json'));
const relationDir = path.join(root, 'packages/core/src/semantic/relations');
const collections = fs.readFileSync(path.join(root, 'packages/core/src/types/upstream/collections.ts'));
const checks = [
  ['upstream defines completed and blocked controller analysis outcomes', /controller_dataflow_analysis_completed/.test(outcome) && /controller_dataflow_analysis_blocked/.test(outcome)],
  ['blocked outcome retains source identity, invocation, projection, violations and payload evidence', /readonly sourceFile: SourceFile/.test(outcome) && /readonly invocationJudgment:/.test(outcome) && /readonly semanticKnowledgeProjection: SemanticKnowledgeEvidenceProjection/.test(outcome) && /readonly statementPayloads:/.test(outcome) && /projection: Extract<SemanticKnowledgeEvidenceProjection\['productionOutcome'\], \{ readonly kind: 'blocked' \}>/.test(outcome)],
  ['upstream outcome exposes domain operations, not just data variants', /ControllerDataflowAnalysisOutcomeOperationsInterface/.test(outcome) && /readonly completed:/.test(outcome) && /readonly blocked:/.test(outcome) && /readonly isPublishable:/.test(outcome)],
  ['analyzer gates before semantic authority derive', /productionOutcome.kind === 'blocked'/.test(analyzer) && analyzer.indexOf('productionOutcome.kind === \'blocked\'') < analyzer.indexOf('semanticJudgmentAuthority.derive(')],
  ['blocked analyzer result preserves exact producer outcome', /projection: semanticKnowledgeProjection.productionOutcome/.test(analyzer) && /semanticKnowledgeProjection,/.test(analyzer)],
  ['runtime binding exposes the typed outcome', /ControllerDataflowAnalysisOutcome<PhpControllerDataflowPayload>/.test(binding)],
  ['controller body ADT has explicit blocked cases', /controller_body_semantic_blocked/.test(bodyTypes) && /controller_body_semantic_blocked_integrated/.test(bodyTypes)],
  ['parser consumes the typed outcome and does not publish blocked as completed semantic dataflow', /controllerDataflowAnalysisOutcomeOperations.isPublishable\(outcome\)/.test(parser) && /kind: 'controller_body_semantic_blocked'/.test(parser) && /kind: 'controller_body_semantic_blocked_integrated'/.test(parser)],
  ['upstream barrel exports outcome contract', /controllerDataflowAnalysisOutcomeInterface/.test(index)],
  ['deleted relation foundations remain absent', ['relationMembership.ts','relationalSequence.ts','semanticRelations.ts'].every(name => !fs.existsSync(path.join(relationDir, name)))],
  ['protected collections file remains exactly one newline byte', collections.equals(Buffer.from('\n'))],
  ['phase audit command is registered', packageJson.scripts['audit:phase3061-controller-analysis-blocked-outcome-gate'] === 'node scripts/audits/audit-phase3061-controller-analysis-blocked-outcome-gate.cjs'],
];
const results = checks.map(([name, pass]) => ({ name, pass }));
const report = { phase: 3061, title: 'Controller analysis blocked-outcome gate', passed: results.filter(item => item.pass).length, total: results.length, status: results.every(item => item.pass) ? 'PASS' : 'FAIL', results, openItems: [
  'Resolved in Phase 3062: selected blocked controller bodies now gate controller scan, source-AST projection, and manifest publication.',
  'Strict TypeScript dependency closure remains blocked by existing imports into deleted relation foundations.',
  'End-to-end PHP source -> scanner -> controller AST -> CLI manifest fixtures remain unrun.'
] };
console.log(JSON.stringify(report, null, 2));
if (report.status !== 'PASS') process.exitCode = 1;
