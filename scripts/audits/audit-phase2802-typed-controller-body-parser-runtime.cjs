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
const parser = read('packages/core/src/compiler/frontend/php/controllerBodyParser.ts');
const methodParser = read('packages/core/src/compiler/frontend/php/controllerMethodParser.ts');
const test = read('packages/core/src/compiler/scanner/__test__/ecommerceShopDataflowPhase104.spec.ts');
const frontendIndex = read('packages/core/src/compiler/frontend/php/index.ts');
const upstream = read('packages/core/src/types/upstream/controllerBodySemanticJudgmentInterface.ts');
const collections = read('packages/core/src/types/upstream/collections.ts');
check('body parser declares a named operation interface', /export interface ControllerBodyParserInterface/.test(parser) && /export interface ControllerBodyParserOperationInterface/.test(parser));
check('runtime export is interface-first and frozen', /export const controllerBodyParser:\s*ControllerBodyParserInterface\s*=\s*Object\.freeze\(/.test(parser));
check('syntax-only overload preserves ControllerBodyAst<false>', /ControllerBodyAst<false>/.test(parser) && /kind: 'syntax_only'/.test(parser));
check('invocation-semantic overload preserves ControllerBodyAst<true>', /ControllerBodyAst<true>/.test(parser) && /kind: 'invocation_semantic_judgment'/.test(parser));
check('legacy standalone exported parser API is removed', !/export function parseControllerBody\s*\(/.test(parser) && !/export const parseControllerBody\s*=/.test(parser));
check('implementation overloads remain internal', /function parseControllerBodyInternal\(/.test(parser) && !/export function parseControllerBodyInternal/.test(parser));
check('controller method parser uses the typed operation object', /import \{ controllerBodyParser \}/.test(methodParser) && /controllerBodyParser\.parse\(/.test(methodParser) && !/parseControllerBody\(/.test(methodParser));
check('semantic regression test uses the typed operation object', /import \{ controllerBodyParser \}/.test(test) && /controllerBodyParser\.parse\(/.test(test) && !/parseControllerBody\(/.test(test));
check('frontend barrel exports the operation and its contracts', /export \{ controllerBodyParser \}/.test(frontendIndex) && /ControllerBodyParserInterface/.test(frontendIndex) && /ControllerBodyParserOperationInterface/.test(frontendIndex));
check('projection continues to branch exhaustively on existing judgment ADT', /switch \(projectionJudgment\.kind\)/.test(parser) && /case 'syntax_only_projection'/.test(parser) && /case 'invocation_only_projection'/.test(parser) && /case 'semantic_projection'/.test(parser));
check('existing upstream body semantic contract is reused, not duplicated', /ControllerBodySemanticJudgmentAuthorityInterface/.test(upstream) && !/export interface ControllerBodySemanticJudgmentAuthorityInterface/.test(parser));
check('no new generic reasoning primitive or collection abstraction', !/semanticDataflowReasoningAuthority|solveSemanticRelations/.test(parser) && collections.length === 0);
console.log(`${passed}/12 passed`);
if (passed !== 12) process.exitCode = 1;
