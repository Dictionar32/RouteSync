const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');
const interfacePath = 'packages/core/src/types/upstream/semanticDataflowInterface.ts';
const executorPath = 'packages/core/src/types/upstream/semanticDataflowRuntimeExecutor.ts';
const scannerPath = 'packages/core/src/compiler/scanner/lexer/routeAst/semanticDataFlowAnalyzer.ts';
const adapterPath = 'packages/core/src/compiler/scanner/wiring/semanticDataflowInputAdapter.ts';
const bindingPath = 'packages/core/src/compiler/scanner/wiring/semanticDataflowRuntimeBinding.ts';
const iface = read(interfacePath);
const executor = read(executorPath);
const scanner = read(scannerPath);
const adapter = read(adapterPath);
const binding = read(bindingPath);
const checks = [
  ['interface exposes runtime executor contract', /interface SemanticDataflowRuntimeExecutorInterface[\s\S]*?\(request: SemanticDataflowEvidenceExecutionRequest\): SemanticDataflowBoundaryResult[\s\S]*?\(request: SemanticDataflowNoEvidenceExecutionRequest\): SemanticDataflowNoEvidenceResult/.test(iface)],
  ['executor composes existing authority and admission boundary', /semanticDataflowJudgmentBoundary\.admit\(semanticDataflowReasoningAuthority\.judge\(request\.input\.value\)\)/.test(executor) && /semanticDataflowAdmission/.test(executor)],
  ['executor performs no independent semantic solver/classifier', !/switch\s*\(|\bif\s*\(/.test(executor)],
  ['scanner analyzer uses injected upstream runtime interface and binding supplies executor', /executor: SemanticDataflowRuntimeExecutorInterface/.test(scanner) && /executor\.execute\(request\)/.test(scanner) && /semanticDataflowRuntimeExecutor/.test(binding)],
  ['scanner no longer recomposes authority and boundary directly', !/semanticDataflowReasoningAuthority|semanticDataflowJudgmentBoundary/.test(scanner)],
  ['scanner-local knowledge enters through typed adapter', /semanticDataflowRuntimeRequestFromKnowledge/.test(scanner) && /semanticDataflowInputProducer\.create\(evidence\)/.test(adapter)],
  ['legacy projection remains explicit and isolated', /toLegacyPath/.test(scanner) && /compatibility projection/.test(scanner) && /createSemanticDataFlowAnalyzer\(semanticDataflowRuntimeExecutor\)/.test(binding)],
  ['interface implementation is separated from contract declaration', !/const boundaryIdentityKey\s*=/.test(iface) && fs.existsSync(path.join(root, 'packages/core/src/types/upstream/semanticDataflowAdmission.ts'))],
];
for (const [label, passed] of checks) console.log(`${passed ? 'PASS' : 'FAIL'} ${label}`);
if (checks.some(([, passed]) => !passed)) process.exitCode = 1;
