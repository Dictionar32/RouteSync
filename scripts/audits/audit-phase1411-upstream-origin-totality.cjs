const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const checks = [
  ['origin evidence source family is a closed union', read('packages/core/src/types/upstream/sourceAstEvidenceAcquisitionInterface.ts').includes("'model' | 'resource' | 'controller' | 'service'")],
  ['origin rule table is total over SourceAstEvidenceKind', read('packages/core/src/compiler/semantic/sourceAstSemanticOriginAuthority.ts').includes('satisfies Record<SourceAstEvidenceKind, (evidence: SourceAstSemanticOriginEvidence) => ExpressionOrigin>')],
  ['origin resolution is direct relation lookup, not fallback classification', read('packages/core/src/compiler/semantic/sourceAstSemanticOriginAuthority.ts').includes('originRules[evidence.sourceKind](evidence)') && !read('packages/core/src/compiler/semantic/sourceAstSemanticOriginAuthority.ts').includes('relationGate')],
  ['model origin has explicit model-accessor rule', read('packages/core/src/compiler/semantic/sourceAstSemanticOriginAuthority.ts').includes("kind: 'model_accessor'")],
  ['controller origin has explicit controller-action rule', read('packages/core/src/compiler/semantic/sourceAstSemanticOriginAuthority.ts').includes("kind: 'controller_action'")],
  ['service origin has explicit service-method rule', read('packages/core/src/compiler/semantic/sourceAstSemanticOriginAuthority.ts').includes("kind: 'service_method'")],
  ['resource origin has explicit resource-field rule', read('packages/core/src/compiler/semantic/sourceAstSemanticOriginAuthority.ts').includes("kind: 'resource_field'")],
  ['judgment retains frozen source evidence and closed marker', read('packages/core/src/compiler/semantic/sourceAstSemanticOriginAuthority.ts').includes('evidence: Object.freeze({ ...evidence })') && read('packages/core/src/compiler/semantic/sourceAstSemanticOriginAuthority.ts').includes('closed: true')],
  ['semantic producer delegates origin to upstream authority', read('packages/core/src/compiler/semantic/sourceAstSemanticProducer.ts').includes('sourceAstSemanticOriginAuthority.resolve')],
  ['semantic producer interface returns typed AST products', read('packages/core/src/types/upstream/sourceAstSemanticProducerInterface.ts').includes('SourceAstSemanticProducts') && read('packages/core/src/types/upstream/sourceAstSemanticProducerInterface.ts').includes('closed: true')],
  ['operation identity remains upstream-owned', read('packages/core/src/types/upstream/operationIdentityCapabilityAuthority.ts').includes('operationIdentityCapabilityAuthority')],
  ['semantic dataflow remains a closed upstream judgment contract', read('packages/core/src/types/upstream/semanticDataflow.ts').includes('readonly facts: readonly SemanticDataflowInputFact[]') && read('packages/core/src/types/upstream/semanticDataflow.ts').includes('readonly closed: true')],
  ['runtime dataflow adapter consumes canonical judgment interface', read('packages/core/src/compiler/analysis/semanticDataflowDataFlowAdapter.ts').includes('SemanticDataflowJudgment')],
  ['IR projection consumes upstream semantic dataflow contract', read('packages/core/src/compiler/ir/SemanticDataflowIRProjection.ts').includes('SemanticDataflowJudgment')],
  ['package version remains 1.0.49 and build command remains tsdown', (() => { const pkg = JSON.parse(read('package.json')); return pkg.version === '1.0.49' && pkg.scripts.build === 'tsdown'; })()],
];
const results = checks.map(([name, passed]) => ({ name, passed: Boolean(passed) }));
for (const result of results) process.stdout.write(`${result.passed ? 'PASS' : 'FAIL'} ${result.name}\n`);
process.stdout.write(`RESULT ${results.every(result => result.passed) ? 'passed' : 'failed'} ${results.filter(result => result.passed).length}/${results.length}\n`);
if (results.some(result => !result.passed)) process.exitCode = 1;
