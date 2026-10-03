const fs = require('fs');
const path = require('path');
const ts = require('typescript');

const root = path.resolve('packages/core/src');
const banned = {
  if: n => ts.isIfStatement(n), while: n => ts.isWhileStatement(n) || ts.isDoStatement(n),
  for: n => ts.isForStatement(n) || ts.isForOfStatement(n) || ts.isForInStatement(n), switch: n => ts.isSwitchStatement(n),
  map: n => ts.isCallExpression(n) && ts.isPropertyAccessExpression(n.expression) && n.expression.name.text === 'map',
  filter: n => ts.isCallExpression(n) && ts.isPropertyAccessExpression(n.expression) && n.expression.name.text === 'filter',
  reduce: n => ts.isCallExpression(n) && ts.isPropertyAccessExpression(n.expression) && n.expression.name.text === 'reduce',
  flatMap: n => ts.isCallExpression(n) && ts.isPropertyAccessExpression(n.expression) && n.expression.name.text === 'flatMap',
  undefined: n => ts.isIdentifier(n) && n.text === 'undefined', null: n => n.kind === ts.SyntaxKind.NullKeyword,
  '??': n => ts.isBinaryExpression(n) && n.operatorToken.kind === ts.SyntaxKind.QuestionQuestionToken,
  '===': n => ts.isBinaryExpression(n) && n.operatorToken.kind === ts.SyntaxKind.EqualsEqualsEqualsToken,
  '!==': n => ts.isBinaryExpression(n) && n.operatorToken.kind === ts.SyntaxKind.ExclamationEqualsEqualsToken,
  'as unknown': n => ts.isAsExpression(n) && n.type.kind === ts.SyntaxKind.UnknownKeyword,
  Set: n => ts.isIdentifier(n) && n.text === 'Set', Map: n => ts.isIdentifier(n) && n.text === 'Map',
  any: n => ts.isIdentifier(n) && n.text === 'any', new: n => ts.isNewExpression(n), ternary: n => ts.isConditionalExpression(n),
};
const files = [];
const walk = d => fs.readdirSync(d, {withFileTypes:true}).forEach(e => { const p=path.join(d,e.name); if(e.isDirectory()) walk(p); else if(e.name.endsWith('.ts') && !p.includes(`${path.sep}__tests__${path.sep}`) && !p.includes(`${path.sep}__test__${path.sep}`)) files.push(p); });
walk(root);
const countFile = f => { const sf=ts.createSourceFile(f,fs.readFileSync(f,'utf8'),ts.ScriptTarget.Latest,true); const c=Object.fromEntries(Object.keys(banned).map(k=>[k,0])); const v=n=>{ for(const [k,p] of Object.entries(banned)) if(p(n)) c[k]++; ts.forEachChild(n,v); }; v(sf); return c; };
const global=Object.fromEntries(Object.keys(banned).map(k=>[k,0]));
const selectedRel = [
  'compiler/scanner/LaravelSourceLexer.ts','compiler/scanner/lexer/tokenizer.ts','compiler/scanner/lexer/astClassifierEvidence.ts',
  'compiler/scanner/upstream/route/routeGroupSemanticResolver.ts','compiler/scanner/subscanners/InvalidationResolver.ts',
  'compiler/analysis/ssa/ssaBuilder.ts','compiler/analysis/ssa/ssaRenamer.ts','compiler/analysis/ssa/ssaRepresentation.ts',
  'compiler/analysis/ssa/renamer/blockInstructionRenamer.ts','compiler/analysis/ssa/renamer/variableVersionScope.ts',
  'compiler/analysis/loop/loopDetector.ts','compiler/analysis/loop/loopNormalizer.ts','compiler/analysis/loop/loopTypes.ts',
  'compiler/analysis/dominator/dominatorTree.ts','compiler/analysis/dominator/dominatorRpo.ts','compiler/analysis/dominator/dominanceFrontier.ts',
  'compiler/analysis/dataflow/forwardSolver.ts','compiler/analysis/dataflow/backwardSolver.ts',
  'compiler/types/TypeHasher.ts','compiler/types/resolved-php/variants.ts','compiler/types/resolved-php/matcher.ts',
  'compiler/types/system/assignabilityChecker.ts','compiler/types/system/subtypingChecker.ts','compiler/types/system/typeLattice.ts',
].map(x=>path.join(root,x));
const selected={}; for(const f of selectedRel){ const c=countFile(f); selected[path.relative(root,f).replaceAll(path.sep,'/')]=c; }
for(const f of files){ const c=countFile(f); for(const k of Object.keys(global)) global[k]+=c[k]; }
const emptyProduction=files.filter(f=>fs.statSync(f).size===0).map(f=>path.relative(root,f).replaceAll(path.sep,'/'));
const out={phase:599,productionFiles:files.length,emptyProductionFiles:emptyProduction,selected,global};
fs.writeFileSync(path.resolve('docs/PHASE599_RELATIONAL_FRONTIER_AUDIT.json'),JSON.stringify(out,null,2));
console.log(JSON.stringify(out,null,2));
