const fs = require('fs');
const path = require('path');
const root = path.resolve(__dirname, '..');
const canonical = path.join(root, 'packages/core/src/compiler/scanner/lexer/routeAst/semanticObjectIdentityRelations.ts');
const legacy = path.join(root, 'packages/core/src/compiler/scanner/lexer/routeAst/semanticObjectIdentity.ts');
const central = [
  path.join(root, 'packages/core/src/semantic/kernel/syntax/parserAdapterRelations.ts'),
  path.join(root, 'packages/core/src/compiler/scanner/lexer/routeAst/semanticRelationSolver.ts'),
  path.join(root, 'packages/core/src/compiler/scanner/lexer/routeAst/syntaxErrorRelationCore.ts'),
  path.join(root, 'packages/core/src/semantic/plugins/expression/ternaryHandler.ts'),
];
const patterns = [
  ['if', /\bif\b/g], ['for', /\bfor\b/g], ['while', /\bwhile\b/g], ['switch', /\bswitch\b/g],
  ['map', /\.map\s*\(/g], ['filter', /\.filter\s*\(/g], ['reduce', /\.reduce\s*\(/g], ['flatMap', /\.flatMap\s*\(/g],
  ['undefined', /\bundefined\b/g], ['??', /\?\?/g], ['===', /===/g], ['as', /\bas\b/g],
  ['host-null', /(?<!semantic_)\bnull\b/g],
];
const stripComments = source => source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|\s)\/\/.*$/gm, '$1');
const audit = file => {
  const source = stripComments(fs.readFileSync(file, 'utf8'));
  return Object.fromEntries(patterns.flatMap(([name, pattern]) => {
    const hits = source.match(pattern) || [];
    return hits.length ? [[name, hits.length]] : [];
  }));
};
const result = {
  phase: 361,
  canonical: audit(canonical),
  central: Object.fromEntries(central.map(file => [path.relative(root, file), audit(file)])),
  legacyBytes: fs.statSync(legacy).size,
};
console.log(JSON.stringify(result, null, 2));
process.exit(Object.keys(result.canonical).length || result.legacyBytes !== 0 ? 1 : 0);
