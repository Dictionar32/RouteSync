const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const contract = read('packages/core/src/types/upstream/astClassifierEvidenceContract.ts');
const facade = read('packages/core/src/compiler/scanner/lexer/astClassifierEvidence.ts');
const producer = read('packages/core/src/types/upstream/astSemanticEvidenceProducer.ts');
const semantic = read('packages/core/src/types/upstream/astSemanticInterface.ts');
const syntaxKind = read('packages/core/src/types/upstream/phpAstSyntaxKind.ts');
const expressionTypes = read('packages/core/src/compiler/scanner/lexer/phpAstExpressionTypes.ts');
const runtime = read('packages/core/src/compiler/scanner/lexer/astClassifierRuntime.ts');
const controller = read('packages/core/src/types/upstream/laravelControllerScannerInterface.ts');
const invocationJudgment = read('packages/core/src/types/upstream/laravelControllerInvocationSemanticJudgmentInterface.ts');
const invocationIntegration = read('packages/core/src/types/upstream/phpSourceInvocationSemanticPipelineIntegrationInterface.ts');
const builder = read('packages/core/src/compiler/scanner/wiring/upstreamManifestBuilder.ts');
const cli = read('packages/cli/src/parsers/php/controllerInvocationManifestComposition.ts');
const laravelRouteScanner = read('packages/core/src/compiler/scanner/wiring/laravelRouteScanner.ts');
const barrel = read('packages/core/src/index.ts');
const upstreamBarrel = read('packages/core/src/types/upstream/index.ts');
const checks = [
  ['classifier interface exposes one classify port over a closed request ADT', /readonly classify:[\s\S]*AstClassifierEvidenceRequest<TToken>/.test(contract) && /AstClassifierExpressionRequest<TToken>/.test(contract) && /AstClassifierBlockRequest<TToken>/.test(contract)],
  ['classifier interface uses one request/response ADT port without overloads', /AstClassifierEvidenceResult<TValue, TBlock>/.test(contract) && !/\bfunction classify\s*\([^)]*\)\s*;/.test(contract + facade) && !/\bas\s+(AstClassifier|PhpSource|unknown)/.test(facade)],
  ['syntax request and response ADTs are closed to expression and block outcomes', /AstClassifierEvidenceRequest<TToken>/.test(contract) && /kind: 'expression'/.test(contract) && /kind: 'block'/.test(contract) && !/kind: 'semantic'/.test(contract)],
  ['semantic evidence uses the pre-existing producer interface', /AstSemanticEvidenceProducerInterface/.test(producer) && /produceAstSemanticEvidence\(input\)/.test(facade)],
  ['producer accepts a closed PHP AST syntax-kind vocabulary rather than arbitrary string', /syntax: PhpAstExpressionKind/.test(producer) && !/syntaxKind:\s*string/.test(producer)],
  ['closed syntax-kind vocabulary is a canonical upstream type reused by expression AST', /export type PhpAstExpressionKind/.test(syntaxKind) && /Extract<PhpAstExpressionKind, 'function_call'>/.test(expressionTypes)],
  ['semantic judgment preserves syntax as a typed ADT term instead of flattening it to text', /kind: 'syntax'; readonly value: PhpAstExpressionKind/.test(semantic) && /astSemanticSyntaxTerm\(observation\.syntax\)/.test(producer) && !/astSemanticTextTerm\(observation\.syntax\)/.test(producer)],
  ['semantic response reuses existing AstSemanticStageInterface', /astSemanticStageInterfaceOf\(produceAstSemanticEvidence/.test(facade)],
  ['classifier runtime remains syntax-only', !/createScannerEvidencePort|astSemanticStageAuthority|produceAstSemanticEvidence/.test(runtime)],
  ['facade dispatches through the single classifier port and projects closed results', /astClassifierEvidenceInterface\.classify\(\{ kind: 'expression'/.test(facade) && /astClassifierEvidenceInterface\.classify\(\{ kind: 'block'/.test(facade) && /switch \(result\.kind\)/.test(facade)],
  ['invocation judgment preserves all four exact integrated-response outcomes', ['php_source_invocation_integration_not_connected', 'php_source_invocation_integration_source_binding_rejected', 'php_source_invocation_integration_complete', 'php_source_invocation_integration_blocked'].every(kind => invocationJudgment.includes(kind)) && /readonly response: Extract<PhpSourceInvocationSemanticPipelineIntegrationResult/.test(invocationJudgment)],
  ['integrated response remains a closed ADT owned by its existing interface', /type PhpSourceInvocationSemanticPipelineIntegrationResult\s*=/.test(invocationIntegration) && /php_source_invocation_integration_complete/.test(invocationIntegration) && /php_source_invocation_integration_blocked/.test(invocationIntegration)],
  ['Laravel controller scanner accepts the existing closed invocation inventory receipt', /invocationInventory:\s*LaravelControllerInvocationSemanticJudgmentInventoryClosureReceipt/.test(controller)],
  ['manifest builder forwards the validated inventory into source AST scanning', /constructRouteSyncManifest\([\s\S]*invocationInventoryReceipt:[\s\S]*laravelSourceAstScanner\.scan\(invocationInventoryReceipt\)/.test(builder)],
  ['CLI closes invocation judgments through the existing inventory authority', /laravelControllerInvocationSemanticJudgmentInventoryAuthority\.close\(/.test(cli)],
  ['public barrels export the existing authority and canonical syntax type', /AstClassifierEvidenceInterface/.test(barrel) && /AstSemanticEvidenceProducerInterface/.test(barrel) && /PhpAstExpressionKind/.test(barrel) && /export \* from '.\/phpAstSyntaxKind'/.test(upstreamBarrel) && /export \* from '.\/astSemanticEvidenceProducer'/.test(upstreamBarrel)],
  ['Laravel route scanner closure semanticReturn expression is syntactically closed', /semanticReturn: flow\.target\.value\.kind === 'closure'[\s\S]*?: \{ kind: 'absent' as const \} \}\),/.test(laravelRouteScanner)],
  ['no new parallel semantic authority was introduced', !/NewAstSemanticAuthority|ParallelAstSemanticAuthority/.test(contract + facade + producer)],
];
const failed = checks.filter(([, passed]) => !passed);
const result = { phase: 1961, audit: 'single-ast-adt-port-interface-first', passed: checks.length - failed.length, total: checks.length, checks: checks.map(([name, passed]) => ({ name, passed })) };
const report = path.join(root, 'scripts/audits/reports/phase1961-single-ast-adt-port-interface-first.json');
fs.mkdirSync(path.dirname(report), { recursive: true });
fs.writeFileSync(report, JSON.stringify(result, null, 2) + '\n');
console.log(JSON.stringify(result, null, 2));
if (failed.length) process.exitCode = 1;
