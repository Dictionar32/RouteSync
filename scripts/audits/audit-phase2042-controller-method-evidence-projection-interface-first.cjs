const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const scannerPath = path.join(root, 'packages/core/src/compiler/scanner/wiring/laravelControllerScanner.ts');
const producerPath = path.join(root, 'packages/core/src/compiler/scanner/operations/controller/controllerProducer.ts');
const contractPath = path.join(root, 'packages/core/src/types/upstream/controllerProducerInterface.ts');
const scanner = fs.readFileSync(scannerPath, 'utf8');
const producer = fs.readFileSync(producerPath, 'utf8');
const contract = fs.readFileSync(contractPath, 'utf8');
const checks = [
  ['existing ControllerProducer interface owns method evidence projection', contract.includes('readonly projectMethodEvidence:')],
  ['method evidence input uses upstream syntax evidence rather than scanner AST import', contract.includes('interface ControllerMethodEvidenceSyntax') && !contract.includes("from '../../compiler/frontend/php/controllerAstTypes'")],
  ['projection input carries precomputed action and method contract', contract.includes('readonly action: ControllerActionFlowContract') && contract.includes('readonly contract: ControllerMethodContract')],
  ['projection contract explicitly forbids action semantic reclassification', contract.includes('without-reclassifying-action-semantics')],
  ['existing producer implements canonical method evidence projection', producer.includes('projectMethodEvidence: (input): ControllerMethodEvidence')],
  ['producer derives method span from syntax evidence', producer.includes('input.method.source.startOffset') && producer.includes('input.method.source.endOffset')],
  ['producer preserves exact return-expression syntax kind', producer.includes('expressionKind: returnStatement.expression.kind')],
  ['scanner delegates method evidence construction to existing producer', scanner.includes('return controllerProducer.projectMethodEvidence({')],
  ['scanner no longer manually constructs controller_method_evidence', !scanner.includes("kind: 'controller_method_evidence' as const")],
  ['action and contract semantic derivation remain their existing owners', scanner.includes('controllerMethodContractFromMethod(') && scanner.includes('controllerActionFromMethod(')],
  ['canonical invocation judgment and integrated response remain wired', scanner.includes('controllerProducer.produce({ declaration: declarationEvidence, invocationJudgment })') && scanner.includes('responseJudgmentFor(invocationJudgment, declarationEvidence, responseSemanticPipeline)')],
  ['no relation/foundation subscanner introduced', !fs.existsSync(path.join(root, 'packages/core/src/compiler/scanner/operations/foundation')) && !fs.existsSync(path.join(root, 'packages/core/src/compiler/scanner/operations/relation'))],
];
let passed = 0;
for (const [name, ok] of checks) {
  process.stdout.write(`${ok ? 'PASS' : 'FAIL'} ${name}\n`);
  if (ok) passed += 1;
}
process.stdout.write(`Phase 2042: ${passed}/${checks.length} checks passed\n`);
if (passed !== checks.length) process.exitCode = 1;
