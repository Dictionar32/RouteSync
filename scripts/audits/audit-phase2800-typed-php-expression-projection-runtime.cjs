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
const projectorPath = 'packages/core/src/compiler/frontend/php/phpExpressionStructureProjector.ts';
const runtimePath = 'packages/core/src/compiler/frontend/php/astClassifierRuntime.ts';
const projector = read(projectorPath);
const runtime = read(runtimePath);
const collections = read('packages/core/src/types/upstream/collections.ts');
check('projection operation has a named local interface', /export interface PhpExpressionStructureProjectionOperationInterface/.test(projector));
check('runtime export uses interface-first frozen operation object', /export const phpExpressionStructureProjectionOperation:\s*PhpExpressionStructureProjectionOperationInterface\s*=\s*Object\.freeze\(/.test(projector));
check('operation exposes explicit project input and output types', /project:\s*\(\s*structure: Structure,\s*sourceTokens: readonly TokenDescriptor\[\],\s*projection: PhpExpressionStructureProjection,\s*\): PhpAstValue/.test(projector));
check('legacy exported projection function is removed', !/export const projectPhpExpressionStructure\s*=/.test(projector) && !/export function projectPhpExpressionStructure\s*\(/.test(projector));
check('AST classifier consumes the typed operation', /phpExpressionStructureProjectionOperation\.project\(/.test(runtime));
check('AST classifier no longer imports legacy function', !/import\s*\{\s*projectPhpExpressionStructure\s*\}/.test(runtime));
check('projection remains downstream of already-resolved structured judgment', /case 'structured': return Object\.freeze\(\{ kind: 'resolved', value: phpExpressionStructureProjectionOperation\.project\(judgment\.structure/.test(runtime));
check('explicit expression structure ADT alternatives remain handled', ['short_ternary', 'ternary', 'array_access', 'call', 'binary', 'unary'].every(kind => projector.includes(`case '${kind}'`)));
check('projection does not introduce semantic closure/reasoning authority', !/semanticDataflowReasoningAuthority|solveSemanticRelations|semanticDataflowClosureOperation/.test(projector));
check('upstream collections module remains exactly empty', collections.length === 0);
console.log(`${passed}/10 passed`);
if (passed !== 10) process.exitCode = 1;
