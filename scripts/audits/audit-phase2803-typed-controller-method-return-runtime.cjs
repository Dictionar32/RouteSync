'use strict';
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
let passed = 0;
function check(name, condition) {
  if (!condition) { console.error(`FAIL ${name}`); process.exitCode = 1; return; }
  passed++;
  console.log(`PASS ${name}`);
}
function read(file) { return fs.readFileSync(path.join(root, file), 'utf8'); }
const methodPath = 'packages/core/src/compiler/frontend/php/controllerMethodParser.ts';
const returnPath = 'packages/core/src/compiler/frontend/php/controllerReturnParser.ts';
const declarationPath = 'packages/core/src/compiler/frontend/php/controllerDeclarationParser.ts';
const method = read(methodPath);
const returns = read(returnPath);
const declaration = read(declarationPath);
const regression = read('packages/core/src/compiler/scanner/operations/controller/controllerMethodContract.phase894.test.ts');
const frontendIndex = read('packages/core/src/compiler/frontend/php/index.ts');
const runtimeReturnContract = read('packages/core/src/types/upstream/controllerRuntimeReturnProjectionInterface.ts');
const returnProductionContract = read('packages/core/src/types/upstream/controllerReturnSemanticProductionInterface.ts');
const evidenceContract = read('packages/core/src/types/upstream/controllerEvidence.ts');
const collections = read('packages/core/src/types/upstream/collections.ts');
const scan = read('packages/cli/src/commands/scan.ts');
const sync = read('packages/cli/src/commands/sync.ts');
const builder = read('packages/core/src/compiler/scanner/wiring/upstreamManifestBuilder.ts');
check('controller method parser declares explicit overloaded operation interface', /export interface ControllerMethodParserOperationInterface/.test(method) && /ControllerMethodAst<false>/.test(method) && /ControllerMethodAst<true>/.test(method));
check('controller method runtime export is a frozen interface-first object', /export const controllerMethodParser:\s*ControllerMethodParserInterface\s*=\s*Object\.freeze\(/.test(method));
check('standalone exported parseControllerMethod API is removed', !/export function parseControllerMethod\s*\(/.test(method) && !/export const parseControllerMethod\s*=/.test(method));
check('parameter attribute parser is owned by controllerMethodParser operation', /readonly parseParameterAttributes:/.test(method) && /parseParameterAttributes:\s*parseParameterAttributesInternal/.test(method) && !/export function parseParameterAttributes\s*\(/.test(method));
check('controller declaration parser consumes typed method parser object', /import \{ controllerMethodParser \}/.test(declaration) && /controllerMethodParser\.parse\(/.test(declaration) && /controllerMethodParser\.parseParameterAttributes\(/.test(declaration) && !/\bparseControllerMethod\(/.test(declaration));
check('controller method regression test uses typed operation object', /import \{ controllerMethodParser \}/.test(regression) && /controllerMethodParser\.parse\(/.test(regression) && !/\bparseControllerMethod\(/.test(regression));
check('return parser declares named contract and frozen runtime operation', /export interface ControllerReturnParserInterface/.test(returns) && /export const controllerReturnParser:\s*ControllerReturnParserInterface\s*=\s*Object\.freeze\(/.test(returns));
check('standalone exported parseControllerReturns API is removed', !/export function parseControllerReturns\s*\(/.test(returns) && !/export const parseControllerReturns\s*=/.test(returns));
check('method parser consumes typed return parser operation', /import \{ controllerReturnParser \}/.test(method) && /controllerReturnParser\.parse\(/.test(method) && !/\bparseControllerReturns\(/.test(method));
check('frontend barrel exports method and return operations with their contracts', /export \{ controllerMethodParser \}/.test(frontendIndex) && /ControllerMethodParserOperationInterface/.test(frontendIndex) && /export \{ controllerReturnParser \}/.test(frontendIndex) && /ControllerReturnParserInterface/.test(frontendIndex));
check('existing runtime-return and return-semantic contracts are acknowledged without frontend type leakage', /ControllerRuntimeReturnProjectionInterface/.test(runtimeReturnContract) && /ControllerReturnSemanticProductionInterface/.test(returnProductionContract) && /ControllerReturnExpressionEvidence/.test(evidenceContract) && /TokenDescriptor/.test(method) && /ReturnStatementAst/.test(returns));
check('CLI scan and sync still use manifest scan operation and upstream builder path', /manifestScanOperation\.scan\(/.test(scan) && /manifestScanOperation\.scan\(/.test(sync) && /ManifestBuilderInterface/.test(builder) && /ManifestBuilderJudgment/.test(builder));
check('existing context ADT and return AST are preserved; no new generic reasoning primitive', /kind: 'syntax_only'/.test(method) && /kind: 'invocation_semantic_judgment'/.test(method) && /ControllerMethodAst<boolean>/.test(method) && /ReturnStatementAst/.test(returns) && !/semanticDataflowReasoningAuthority|solveSemanticRelations/.test(method + returns));
check('collections module remains exactly empty', collections.length === 0);
console.log(`${passed}/14 passed`);
if (passed !== 14) process.exitCode = 1;
