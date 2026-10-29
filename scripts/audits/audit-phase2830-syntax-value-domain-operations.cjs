'use strict';
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const syntaxValue = read('packages/core/src/compiler/frontend/php/routeAst/syntaxValue.ts');
const consumers = [
  'packages/core/src/compiler/frontend/php/routeAst/semanticRouteSyntaxRelations.ts',
  'packages/core/src/compiler/frontend/php/routeAst/relationalSyntaxCursor.ts',
  'packages/core/src/compiler/frontend/php/routeAst/syntaxRange.ts',
  'packages/core/src/compiler/frontend/php/routeAst/routeDeclarationParser.ts',
  'packages/core/src/semantic/kernel/syntax/relationalSyntaxCursor.ts',
].map(relative => ({ relative, source: read(relative) }));
const checks = [
  ['existing TokenDescriptor and syntax ADTs reused; no replacement token model', /export type SyntaxTokenFact\s*=/.test(syntaxValue) && /import type \{ TokenDescriptor \}/.test(syntaxValue)],
  ['one explicit SyntaxValueOperationsInterface owns token-domain operations', /export interface SyntaxValueOperationsInterface\s*\{/.test(syntaxValue) && ['tokenSyntaxFact','tokenKind','tokenValue','tokenOperation','tokenRouteMethod','tokenRouteTargetMethod','tokenRouteConstraintMethod','tokenResourceMethod','tokenHasKind','tokenHasOperation','tokenHasResourceMethod'].every(name => new RegExp(`readonly ${name}:`).test(syntaxValue))],
  ['runtime surface uses interface-first frozen operation export', /export const syntaxValueOperations:\s*SyntaxValueOperationsInterface\s*=\s*Object\.freeze\(/.test(syntaxValue)],
  ['no exported function or arrow-function operations remain in syntaxValue.ts', !/^\s*export\s+(?:async\s+)?function\s+|^\s*export\s+const\s+[\w$]+\s*=\s*(?:async\s*)?\(/m.test(syntaxValue)],
  ['token lexical lookup preserves typed optional relation results', /RelationOption<SyntaxTokenFact>/.test(syntaxValue) && /RelationOption<SyntaxRouteMethod>/.test(syntaxValue) && /RelationOption<SyntaxResourceMethod>/.test(syntaxValue)],
  ['semantic route syntax consumer invokes domain operation object', /syntaxValueOperations\.tokenSyntaxFact\(/.test(consumers[0].source) && /syntaxValueOperations\.tokenRouteMethod\(/.test(consumers[0].source)],
  ['relational syntax cursor invokes domain operation object', /syntaxValueOperations\.tokenSyntaxFact\(/.test(consumers[1].source) && /syntaxValueOperations\.tokenHasKind\(/.test(consumers[1].source)],
  ['syntax range invokes domain operation object', /syntaxValueOperations\.tokenHasKind\(/.test(consumers[2].source) && /syntaxValueOperations\.tokenHasOperation\(/.test(consumers[2].source)],
  ['route declaration parser invokes domain operation object', /syntaxValueOperations\.tokenHasKind\(/.test(consumers[3].source) && /syntaxValueOperations\.tokenHasOperation\(/.test(consumers[3].source)],
  ['semantic-kernel syntax cursor invokes domain operation object', /syntaxValueOperations\.tokenSyntaxFact\(/.test(consumers[4].source) && /syntaxValueOperations\.tokenHasKind\(/.test(consumers[4].source)],
  ['all active consumers import syntaxValueOperations', consumers.every(({source}) => /syntaxValueOperations/.test(source) && /from ['"][^'"]*syntaxValue['"]/.test(source))],
  ['no active consumer imports legacy free token operations', consumers.every(({source}) => !/import\s*\{[^}]*\btoken(?:SyntaxFact|Kind|Value|Operation|RouteMethod|RouteTargetMethod|RouteConstraintMethod|ResourceMethod|HasKind|HasOperation|HasResourceMethod)\b[^}]*\}\s*from '\.\/syntaxValue'/s.test(source))],
  ['upstream collections remains empty', fs.statSync(path.join(root, 'packages/core/src/types/upstream/collections.ts')).size === 0],
];
let failed = false;
for (const [name, ok] of checks) { console.log(`${ok ? 'PASS' : 'FAIL'} ${name}`); if (!ok) failed = true; }
console.log(`Phase 2830 syntax-value domain operation audit: ${checks.filter(([,ok]) => ok).length}/${checks.length}`);
if (failed) process.exitCode = 1;
