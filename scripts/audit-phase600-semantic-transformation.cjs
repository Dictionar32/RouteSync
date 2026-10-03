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
  'compiler/ir/ContractIRTypeBuilder.ts','compiler/ir/semanticIRLoweringRelations.ts',
  'ir/domain/field-type/fieldTransform.ts','ir/domain/ResourceMapperBuilder.ts','ir/ContractIRBuilder.ts',
  'scanner/LaravelSourceLexer.ts','scanner/lexer/tokenizer.ts','scanner/lexer/astClassifierEvidence.ts',
  'scanner/upstream/route/routeGroupSemanticResolver.ts','scanner/subscanners/InvalidationResolver.ts',
  'analysis/ssa/ssaBuilder.ts','analysis/ssa/ssaRenamer.ts','analysis/loop/loopDetector.ts','analysis/loop/loopNormalizer.ts',
  'analysis/dominator/dominatorTree.ts','analysis/dataflow/forwardSolver.ts','analysis/dataflow/backwardSolver.ts',
  'types/TypeHasher.ts','types/resolved-php/matcher.ts','types/system/assignabilityChecker.ts','types/system/subtypingChecker.ts','types/system/typeLattice.ts',
];
const selected={}; for(const rel of selectedRel){const f=path.join(root,rel); if(fs.existsSync(f)) selected[rel]=countFile(f);}
for(const f of files){const c=countFile(f); for(const k of Object.keys(global)) global[k]+=c[k];}
const emptyProduction=files.filter(f=>fs.statSync(f).size===0).map(f=>path.relative(root,f).replaceAll(path.sep,'/'));
const out={phase:600,productionFiles:files.length,emptyProductionFiles:emptyProduction,deletedUnused:[
 'types/__archive__/legacyFieldAdapter.ts','types/semantic/__archive__/parsedAstAlgebra.ts','compiler/domain/common/ManifestArtifactLowerer.ts','semantic/plugins/MethodReturnResolver.ts'],selected,global};
fs.writeFileSync(path.resolve('docs/PHASE600_SEMANTIC_TRANSFORMATION_AUDIT.json'),JSON.stringify(out,null,2));
console.log(JSON.stringify(out,null,2));
