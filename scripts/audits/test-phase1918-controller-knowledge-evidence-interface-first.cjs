const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');
const checks = [];
const check = (name, condition) => checks.push({ name, passed: Boolean(condition) });

const contract = read('packages/core/src/types/upstream/laravelControllerScannerInterface.ts');
const analyzer = read('packages/core/src/compiler/frontend/php/controllerDataflowAnalyzer.ts');
const wiring = read('packages/core/src/compiler/scanner/wiring/controllerVariableSemanticRuntimeBinding.ts');
const producer = read('packages/core/src/compiler/frontend/php/routeAst/semanticKnowledgeDataFlowProducer.ts');
const adapterContract = read('packages/core/src/types/upstream/semanticKnowledgeEvidenceAdapterInterface.ts');

check('scanner contract and value share version 84', contract.includes('readonly version: 84;') && contract.includes('  version: 84,'));
check('analyzer consumes the pre-existing generic upstream evidence adapter', analyzer.includes('SemanticKnowledgeEvidenceAdapter<PhpBlock>') && analyzer.includes('semanticKnowledgeEvidenceAdapter.produce(block, judgment.sourceFile.value.value)'));
check('analyzer no longer imports or calls the concrete producer function', !analyzer.includes('produceSemanticKnowledgeDataFlow') && !analyzer.includes("from './routeAst/semanticKnowledgeDataFlowProducer'"));
check('PHP-specific evidence adapter remains the source-specific implementation', producer.includes('phpAstSemanticKnowledgeEvidenceAdapter') && producer.includes('semanticKnowledgeEvidenceAdapter(producePhpAstSemanticKnowledgeDataFlow)'));
check('composition root injects the existing PHP evidence adapter', wiring.includes('phpAstSemanticKnowledgeEvidenceAdapter') && wiring.includes('  phpAstSemanticKnowledgeEvidenceAdapter,'));
check('upstream contract retains a parser-neutral evidence-to-model boundary', adapterContract.includes('SemanticKnowledgeEvidenceAdapter<TEvidence>') && adapterContract.includes('SemanticKnowledgeDataFlow'));
check('scanner contract records adapter ownership and forbids concrete producer selection in analyzer', contract.includes('controllerDataflowKnowledgeEvidenceAdapterBoundary') && contract.includes('analyzer-does-not-directly-import-or-select-a-concrete-knowledge-producer'));
check('invocation judgment and integrated response remain separate and exact response is composed', analyzer.includes('phpSourceInvocationPipeline: judgment.response') && analyzer.includes('invocationJudgment: judgment') && analyzer.includes('invocationSemanticIntegratedResponse'));
check('closed variable semantic judgment is still retained directly from the existing executor', analyzer.includes('const semanticResolution = executor.execute(semanticResolutionInputAdapter.adapt({') && analyzer.includes('semanticResolution,'));
check('remaining semantic orchestration is not falsely described as wiring-only', analyzer.includes('still orchestrates knowledge production, semantic authority calls, and definition projection'));

for (const result of checks) process.stdout.write(`${result.passed ? 'PASS' : 'FAIL'} ${result.name}\n`);
process.stdout.write(`RESULT ${checks.filter((item) => item.passed).length}/${checks.length}\n`);
if (checks.some((item) => !item.passed)) process.exitCode = 1;
