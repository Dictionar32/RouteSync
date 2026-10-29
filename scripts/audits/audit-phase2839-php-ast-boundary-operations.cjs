'use strict';
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const contract = read('packages/cli/src/parsers/php/astBoundarySemanticInterface.ts');
const adapter = read('packages/cli/src/parsers/php/boundaryAdapter.ts');
const mapper = read('packages/cli/src/parsers/php/nodeMapper.ts');
const phpBarrel = read('packages/cli/src/parsers/php/index.ts');
const cliBarrel = read('packages/cli/src/index.ts');
const pkg = JSON.parse(read('package.json'));
const checks = [
  ['runtime AST boundary constructors are exposed through one interface-first object', /export const phpAstBoundaryOperations:\s*PhpAstBoundaryOperationsInterface\s*=\s*Object\.freeze\(/.test(contract)],
  ['fact constructor is an operation on the typed object', /interface PhpAstBoundaryOperationsInterface[\s\S]*fact:[\s\S]*judgment:/.test(contract)],
  ['judgment exposes a typed domain continuation', /interface PhpAstBoundaryJudgment[\s\S]*continueWith: <Result>\(handlers: PhpAstBoundaryJudgmentHandlers<Result>\)/.test(contract)],
  ['continuation distinguishes adapted AST from parser gap', /interface PhpAstBoundaryJudgmentHandlers<Result>[\s\S]*onAdapted:[\s\S]*onParserGap:/.test(contract)],
  ['parser-gap terminal dispatch is bound where the judgment is created', /ast\.kind === 'unsupported'[\s\S]*handlers\.onParserGap\(judgment\)[\s\S]*handlers\.onAdapted\(judgment\)/.test(contract)],
  ['reasoning primitive was removed from the boundary judgment', !/reasoning\s*:\s*'typed_grammar_to_canonical_ast'/.test(contract)],
  ['old exported free constructors are retired', !/export const phpAstBoundary(?:Fact|Judgment)\s*=\s*\(/.test(contract)],
  ['adapter uses the interface-first judgment operation', /phpAstBoundaryOperations\.judgment\(/.test(adapter)],
  ['adapter consumes the ADT continuation instead of reading ast directly', /adaptJudgment\(node, code\)\.continueWith\(/.test(adapter) && !/adaptJudgment\(node, code\)\.ast/.test(adapter)],
  ['node mapper routes through the adapter runtime operation', /phpAstBoundaryAdapter\.adapt\(grammarNode, originalCode\)/.test(mapper)],
  ['PHP parser barrel explicitly exports the runtime operation and contracts', /phpAstBoundaryOperations[\s\S]*PhpAstBoundaryOperationsInterface/.test(phpBarrel)],
  ['CLI runtime barrel explicitly exports the boundary operation and contracts', /export \{ phpAstBoundaryOperations \}[\s\S]*PhpAstBoundaryOperationsInterface/.test(cliBarrel)],
  ['upstream collections remains empty', fs.statSync(path.join(root, 'packages/core/src/types/upstream/collections.ts')).size === 0],
  ['audit script is registered', pkg.scripts?.['audit:phase2839-php-ast-boundary-operations'] === 'node scripts/audits/audit-phase2839-php-ast-boundary-operations.cjs'],
];
let failed = false;
for (const [name, ok] of checks) { console.log(`${ok ? 'PASS' : 'FAIL'} ${name}`); if (!ok) failed = true; }
console.log(`Phase 2839 PHP AST boundary operations audit: ${checks.filter(([, ok]) => ok).length}/${checks.length}`);
console.log('SCOPE: structural source assertions only; not a TypeScript build, complete test suite, or CLI end-to-end run.');
if (failed) process.exitCode = 1;
