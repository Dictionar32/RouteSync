const fs = require('node:fs');
const path = require('node:path');
const root = process.cwd();
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');
const analyzer = read('packages/core/src/compiler/scanner/lexer/controllerDataflowAnalyzer.ts');
const wiring = read('packages/core/src/compiler/scanner/wiring/controllerVariableSemanticRuntimeBinding.ts');
const contract = read('packages/core/src/types/upstream/laravelControllerScannerInterface.ts');
const adapterInterface = read('packages/core/src/types/upstream/semanticKnowledgeEvidenceAdapterInterface.ts');
const producer = read('packages/core/src/compiler/scanner/lexer/routeAst/semanticKnowledgeDataFlowProducer.ts');
const checks = [
  ['upstream SemanticKnowledgeEvidenceAdapter contract exists', /export interface SemanticKnowledgeEvidenceAdapter<TEvidence>/.test(adapterInterface)],
  ['analyzer declares adapter as a required typed dependency', /semanticKnowledgeEvidenceAdapter: SemanticKnowledgeEvidenceAdapter<PhpBlock>/.test(analyzer)],
  ['analyzer invokes the injected adapter for canonical knowledge production', /semanticKnowledgeEvidenceAdapter\.produce\(block, judgment\.sourceFile\.value\.value\)/.test(analyzer)],
  ['definition projection receives the same injected adapter explicitly', /semanticResolutionInputAdapter, semanticKnowledgeEvidenceAdapter\)/.test(analyzer)],
  ['PHP-specific adapter is injected at composition root', /phpAstSemanticKnowledgeEvidenceAdapter/.test(wiring) && /phpAstSemanticKnowledgeEvidenceAdapter,/.test(wiring)],
  ['analyzer has no direct import or selection of concrete knowledge producer', !/produceSemanticKnowledgeDataFlow|phpAstSemanticKnowledgeEvidenceAdapter|producePhpAstSemanticKnowledgeDataFlow/.test(analyzer)],
  ['PHP adapter still implements the existing upstream contract', /SemanticKnowledgeEvidenceAdapter<PhpBlock>/.test(producer) && /phpAstSemanticKnowledgeEvidenceAdapter\.produce/.test(producer)],
  ['scanner contract interface and value use synchronized version 85', /readonly version: 85/.test(contract) && /version: 85,/.test(contract) && !/readonly version: 84|version: 84,/.test(contract)],
  ['contract records adapter dependency propagation invariant', /controllerDataflowKnowledgeEvidenceAdapterPropagationBoundary/.test(contract) && (contract.match(/controllerDataflowKnowledgeEvidenceAdapterPropagationBoundary/g) || []).length === 2],
  ['canonical invocation judgment and integrated response composition remain distinct', /invocationJudgment: judgment/.test(analyzer) && /responseComposition\.integrate\(\{ knowledge: semanticKnowledgeDataFlow, phpSourceInvocationPipeline: judgment\.response \}\)/.test(analyzer)],
];
const failed = checks.filter(([, pass]) => !pass);
for (const [name, pass] of checks) process.stdout.write(`${pass ? 'PASS' : 'FAIL'} ${name}\n`);
process.stdout.write(`RESULT ${checks.length - failed.length}/${checks.length}\n`);
if (failed.length) process.exitCode = 1;
