const fs = require('fs');
const path = require('path');
const root = path.resolve('packages/core/src');
const targets = [
  'semantic/kernel/syntax/parserAdapterRelations.ts',
  'compiler/constraints/solver/declarativeConstraintRelations.ts',
  'compiler/scanner/lexer/routeAst/semanticRelationSolver.ts',
  'compiler/scanner/lexer/routeAst/syntaxErrorRelationCore.ts',
  'semantic/plugins/expression/ternaryHandler.ts',
];
const patterns = {
  if: /\bif\b/g, for: /\bfor\b/g, while: /\bwhile\b/g, switch: /\bswitch\b/g,
  map: /\.map\s*\(/g, filter: /\.filter\s*\(/g, reduce: /\.reduce\s*\(/g,
  flatMap: /\.flatMap\s*\(/g, undefined: /\bundefined\b/g, coalesce: /\?\?/g,
  hostNull: /\bnull\b/g, strictEqual: /===|!==/g, assertion: /\bas\b/g,
  ternary: /\?[^\n:]+:/g,
};
const out={phase:364,files:{}};
for(const rel of targets){
 const file=path.join(root,rel); const text=fs.readFileSync(file,'utf8').replace(/\/\*[\s\S]*?\*\//g,'').replace(/\/\/.*$/gm,'');
 out.files[rel]={}; for(const [k,re] of Object.entries(patterns)) out.files[rel][k]=(text.match(re)||[]).length;
}
console.log(JSON.stringify(out,null,2));
