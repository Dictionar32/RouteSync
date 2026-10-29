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
const parserPath = 'packages/core/src/compiler/frontend/php/controllerDeclarationParser.ts';
const parser = read(parserPath);
const lexer = read('packages/core/src/compiler/scanner/LaravelSourceLexer.ts');
const frontendIndex = read('packages/core/src/compiler/frontend/php/index.ts');
const collections = read('packages/core/src/types/upstream/collections.ts');
const semanticTest = read('packages/core/src/compiler/scanner/operations/controller/controllerParserProjectionContext.phase1900.test.ts');
check('controller parser has named frontend-owned operation interface', /export interface ControllerDeclarationParserInterface/.test(parser));
check('runtime export is interface-first and frozen', /export const controllerDeclarationParser:\s*ControllerDeclarationParserInterface\s*=\s*Object\.freeze\(/.test(parser));
check('syntax-only projection has a distinct typed entry', /readonly parseSyntaxOnly:[\s\S]*?ControllerDeclarationAst<false>/.test(parser));
check('canonical invocation judgment has a distinct typed entry', /readonly parseWithInvocationJudgment:[\s\S]*?ControllerDeclarationAst<true>/.test(parser));
check('legacy standalone exported parseControllerDeclaration API is removed', !/export function parseControllerDeclaration\s*\(/.test(parser) && !/export const parseControllerDeclaration\s*=/.test(parser));
check('legacy standalone invocation wrapper is removed', !/export const parseControllerDeclarationFromInvocationJudgment\s*=/.test(parser));
check('facade dispatches by explicit projection context ADT', /context\.kind === 'syntax_only'[\s\S]*?parseSyntaxOnly[\s\S]*?parseWithInvocationJudgment/.test(lexer));
check('facade exposes the typed parser object rather than legacy standalone exports', /controllerDeclarationParser,/.test(lexer) && !/import\s*\{\s*parseControllerDeclaration\s*,/.test(lexer));
check('frontend barrel exports operation and interface', /export \{ controllerDeclarationParser \}/.test(frontendIndex) && /export type \{ ControllerDeclarationParserInterface \}/.test(frontendIndex));
check('semantic parser test passes the canonical judgment directly', /parseWithInvocationJudgment\([^;]*judgment\)/s.test(semanticTest));
check('parser retains class-body inventory blocked/complete ADT', /controller_method_declaration_inventory_blocked/.test(parser) && /controller_method_declaration_inventory_complete/.test(parser));
check('no new upstream reasoning primitive and collections module stays empty', !/semanticDataflowReasoningAuthority|solveSemanticRelations/.test(parser) && collections.length === 0);
console.log(`${passed}/12 passed`);
if (passed !== 12) process.exitCode = 1;
