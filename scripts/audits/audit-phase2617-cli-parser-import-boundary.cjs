const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const lexer = read('packages/core/src/compiler/scanner/LaravelSourceLexer.ts');
const graphIndex = read('packages/core/src/graph/service/graphNodeIndex.ts');
const checks = [
  ['route-parser-imports-concrete-parser-not-semantic-barrel', lexer.includes('from "./lexer/routeAst/routeDeclarationParser"') && !lexer.includes('from "./lexer/routeAst"')],
  ['route-ast-type-imports-concrete-adt-owner', lexer.includes('from "./lexer/routeAst/routeDeclarationAst"')],
  ['graph-node-index-has-no-relations-imports', !/from ['"][^'"]*semantic\/relations\//.test(graphIndex)],
  ['graph-node-index-uses-upstream-lookup-adt', graphIndex.includes("import { matchLookup } from '../../types/upstream/collections'") && graphIndex.includes('readonly lookup: (reference: GraphNodeReference) => Lookup<T>')],
  ['graph-node-index-preserves-public-operations', ['set:', 'lookup:', 'has:', 'get size()', 'referencesIterator:'].every(token => graphIndex.includes(token))],
  ['cli-composition-still-uses-narrow-upstream-entrypoint', read('packages/cli/src/standaloneCompositionLoader.ts').includes("from '@routesync/core/upstream'") && read('packages/cli/src/upstreamCompositionFactory.ts').includes("from '@routesync/core/upstream'")],
  ['no-foundation-import-added-to-target-files', ![lexer, graphIndex].some(source => /semantic\/foundation\//.test(source))],
];
for (const [name, passed] of checks) process.stdout.write(`${passed ? 'PASS' : 'BLOCKER'} ${name}\n`);
process.stdout.write(`\nPhase 2617: ${checks.filter(([, passed]) => passed).length}/${checks.length} checks passed.\n`);
if (checks.some(([, passed]) => !passed)) process.exitCode = 1;
