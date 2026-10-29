const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');
const checks = [];
const check = (name, condition) => checks.push({ name, passed: Boolean(condition) });

const judgment = read('packages/core/src/types/upstream/laravelControllerInvocationSemanticJudgmentInterface.ts');
const scannerInterface = read('packages/core/src/types/upstream/laravelControllerScannerInterface.ts');
const declaration = read('packages/core/src/compiler/frontend/php/controllerDeclarationParser.ts');
const method = read('packages/core/src/compiler/frontend/php/controllerMethodParser.ts');
const body = read('packages/core/src/compiler/frontend/php/controllerBodyParser.ts');
const astTypes = read('packages/core/src/compiler/frontend/php/controllerBodyAstTypes.ts');
const scanner = read('packages/core/src/compiler/scanner/wiring/laravelControllerScanner.ts');
const attribute = read('packages/core/src/compiler/scanner/operations/attributeAstCanonical.ts');
const provider = read('packages/core/src/compiler/scanner/operations/providerAstCanonical.ts');
const middleware = read('packages/core/src/compiler/scanner/operations/middlewareAstCanonical.ts');
const response = read('packages/core/src/compiler/scanner/operations/responseScanner.ts');
const test = read('packages/core/src/compiler/scanner/operations/controller/controllerParserProjectionContext.phase1900.test.ts');

check('existing canonical judgment model remains the only judgment model', /export type LaravelControllerInvocationSemanticJudgment\s*=\s*LaravelControllerInvocationSemanticJudgmentInterface/.test(judgment) && !/InvocationSemanticJudgmentV2/.test(judgment));
check('projection context is a closed syntax-only-or-canonical-judgment union', /kind: 'syntax_only'/.test(judgment) && /kind: 'invocation_semantic_judgment'; readonly judgment: LaravelControllerInvocationSemanticJudgmentInterface/.test(judgment));
check('parser no longer accepts independent filePath and integratedResponse arguments', /context: LaravelControllerAstProjectionContext/.test(declaration) && !/filePath = '<php-source>'/.test(declaration) && !/integratedResponse: InvocationPhpSourceIntegratedResponse/.test(declaration));
check('syntax-only body projection omits dataflow rather than creating not-connected semantics', /context\.kind === 'syntax_only'[\s\S]*dataflow: undefined/.test(body) && /dataflow: Semantic extends true \? ControllerDataflowAst : undefined/.test(astTypes));
check('semantic body projection derives identity and response from the same judgment', /buildDataflow\(parsedBlock, parameters, parameterSemantics, context\.judgment\)/.test(body));
check('production Laravel scanner supplies the canonical invocation judgment', /parseControllerDeclarationFromInvocationJudgment\(source, tokens, createAstIdentifier\(controllerName\), invocationJudgment\)/.test(scanner));
check('attribute and provider consumers explicitly use syntax-only projection', /parseControllerDeclaration\([^\n]*\{ kind: 'syntax_only' \}\)/.test(attribute) && /parseControllerDeclaration\([^\n]*\{ kind: 'syntax_only' \}\)/.test(provider));
check('middleware and response consumers do not misclassify semantic use as syntax-only', /kind: 'invocation_semantic_judgment', judgment: invocationJudgment/.test(middleware) && /kind: 'invocation_semantic_judgment', judgment: invocationJudgment/.test(response));
check('scanner contract versions match the implementation', /readonly contractVersion: 16/.test(scannerInterface) && /contractVersion: 16/.test(scanner) && /readonly version: 68/.test(scannerInterface) && /version: 68/.test(scannerInterface));
check('no new foundation/relation imports are introduced in the upstream projection contract', !/from ['"].*semantic\/(?:relations|foundation)/.test(judgment));

for (const item of checks) process.stdout.write(`${item.passed ? 'PASS' : 'FAIL'} ${item.name}\n`);
process.stdout.write(`\n${checks.filter((item) => item.passed).length}/${checks.length} checks passed\n`);
if (checks.some((item) => !item.passed)) process.exitCode = 1;
