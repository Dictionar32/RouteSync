const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const checks = [];
const check = (name, condition) => checks.push({ name, result: condition ? 'PASS' : 'FAIL' });

const analyzer = read('packages/core/src/compiler/frontend/php/controllerDataflowAnalyzer.ts');
const binding = read('packages/core/src/compiler/scanner/wiring/controllerVariableSemanticRuntimeBinding.ts');
const parser = read('packages/core/src/compiler/frontend/php/controllerBodyParser.ts');
const methodParser = read('packages/core/src/compiler/frontend/php/controllerMethodParser.ts');
const contract = read('packages/core/src/types/upstream/laravelControllerScannerInterface.ts');
const judgmentInterface = read('packages/core/src/types/upstream/phpAstExpressionSemanticAuthorityInterface.ts');
const authorityImpl = read('packages/core/src/compiler/scanner/operations/resource/resourceUpstreamExpressionCanonical.ts');

check('existing upstream PHP expression authority interface is the injected contract',
  judgmentInterface.includes('interface PhpAstExpressionSemanticAuthorityInterface<Evidence>') &&
  analyzer.includes('PhpAstExpressionSemanticAuthorityInterface<PhpAstValue>'));
check('analyzer derives expression through authority rather than direct concrete mapper',
  analyzer.includes('expressionAuthority.derive({') &&
  !analyzer.includes('mapResourcePhpAstToUpstream'));
check('production composition root wires the existing source adapter authority',
  binding.includes('resourcePhpAstExpressionSemanticAuthority') &&
  binding.includes('controllerDataflowBindingPayloadCorrespondenceAuthority,\n  resourcePhpAstExpressionSemanticAuthority'));
check('expression provenance comes from the canonical invocation judgment source file',
  analyzer.includes('judgment.sourceFile, executor, expressionAuthority') &&
  /sourceFile,\s*classContext: \{ kind: 'none' \}/.test(analyzer) &&
  analyzer.includes('produceSemanticKnowledgeDataFlow(block, filePath)'));
check('raw parameter identifier list is removed from dataflow analyzer and wiring',
  !/block:\s*PhpBlock,\s*parameters:\s*readonly AstIdentifier\[\]/s.test(analyzer) &&
  !/block:\s*import\([^\n]+\)\.PhpBlock,\s*parameters:/s.test(binding));
check('controller body parser accepts semantic parameter bindings instead of duplicate raw identifiers',
  !/tokens:\s*readonly TokenDescriptor\[\],\s*parameters:\s*readonly AstIdentifier\[\]/s.test(parser) &&
  methodParser.includes('relationProject(parameters, parameterSemanticEntry)'));
check('semantic resolution judgment type is explicitly imported',
  analyzer.includes('ControllerVariableSemanticJudgment, ControllerVariableSemanticRuntimeExecutorInterface'));
check('canonical invocation judgment and integrated response remain separately retained',
  analyzer.includes('invocationSemanticIntegratedResponse, invocationJudgment: judgment') &&
  analyzer.includes('phpSourceInvocationPipeline: judgment.response'));
check('scanner contract version and expression-projection boundary are updated',
  contract.includes('readonly version: 78;') &&
  contract.includes('version: 78,') &&
  contract.includes('controllerDataflowExpressionProjectionAuthorityBoundary'));
check('existing authority implementation remains source-adapter-owned and explicit',
  authorityImpl.includes('resourcePhpAstExpressionSemanticAuthority: PhpAstExpressionSemanticAuthorityInterface<PhpAstValue>'));

for (const item of checks) process.stdout.write(`${item.result} ${item.name}\n`);
const failures = checks.filter(item => item.result !== 'PASS');
process.stdout.write(`\n${checks.length - failures.length}/${checks.length} checks passed\n`);
if (failures.length > 0) process.exitCode = 1;
