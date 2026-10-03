const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const targets = [
  'packages/core/src/compiler/scanner/lexer/routeAst/phpAstSemanticKnowledgeDataFlowAdapter.ts',
  'packages/core/src/compiler/scanner/lexer/routeAst/semanticVersionedStateDataFlowRelations.ts',
  'packages/core/src/compiler/scanner/lexer/routeAst/semanticInterproceduralDataFlowRelations.ts',
  'packages/core/src/compiler/scanner/lexer/routeAst/semanticRelationalCollections.ts',
  'packages/core/src/compiler/scanner/lexer/routeAst/semanticRelationStore.ts',
  'packages/core/src/semantic/kernel/syntax/parserAdapterRelations.ts',
  'packages/core/src/semantic/plugins/expression/ternaryHandler.ts',
];
const forbidden = [
  /\bif\b/g, /\bfor\b/g, /\bwhile\b/g, /\bswitch\b/g,
  /\.map\s*\(/g, /\.filter\s*\(/g, /\.reduce\s*\(/g, /\.flatMap\s*\(/g,
  /\bundefined\b/g, /\?\?/g, /===/g, /\bas\b/g,
];
const stripComments = source => source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '');
const violations = {};
for (const relative of targets) {
  const file = path.join(root, relative);
  const source = stripComments(fs.readFileSync(file, 'utf8'));
  const hits = forbidden.flatMap(pattern => {
    const local = source.match(pattern) || [];
    return local.map(hit => hit);
  });
  if (hits.length) violations[relative] = [...new Set(hits)];
}
const legacy = [
  'packages/core/src/compiler/scanner/lexer/routeAst/semanticVersionedStateDataFlow.ts',
  'packages/core/src/compiler/scanner/lexer/routeAst/semanticInterproceduralDataFlow.ts',
];
const legacyBytes = Object.fromEntries(legacy.map(relative => [relative, fs.statSync(path.join(root, relative)).size]));
const result = { phase: 362, violations, legacyBytes };
console.log(JSON.stringify(result, null, 2));
if (Object.keys(violations).length || Object.values(legacyBytes).some(size => size !== 0)) process.exit(1);
