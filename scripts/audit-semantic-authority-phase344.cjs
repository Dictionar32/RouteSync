const fs = require('fs');
const path = require('path');
const root = path.resolve(__dirname, '..');
const targets = [
  'packages/core/src/compiler/constraints/solver/declarativeConstraintProgram.ts',
  'packages/core/src/semantic/kernel/syntax/syntaxEvidenceClosure.ts',
  'packages/core/src/compiler/constraints/solver/constraintStep.ts',
  'packages/core/src/compiler/scanner/lexer/routeAst/syntaxErrorRelationCore.ts',
  'packages/core/src/semantic/plugins/expression/ternaryHandler.ts',
];
const forbidden = /\b(if|while|for|switch)\b|\.map\(|\.filter\(|\.reduce\(|\.flatMap\(|\bundefined\b|\?\?|===|!==|\bas\b/g;
const violations=[];
for (const rel of targets) {
  const file=path.join(root,rel);
  const text=fs.readFileSync(file,'utf8').replace(/\/\*[\s\S]*?\*\//g,'').replace(/\/\/.*$/gm,'');
  const hits=text.match(forbidden)||[];
  if(hits.length) violations.push({file:rel,count:hits.length,hits:[...new Set(hits)]});
}
console.log(JSON.stringify({phase:344,violations},null,2));
process.exitCode=violations.length?1:0;
