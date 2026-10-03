const fs = require('fs');
const path = require('path');
const ts = require('/opt/nvm/versions/node/v22.16.0/lib/node_modules/typescript');

const root = path.resolve('packages/core/src');
const astPath = path.join(root, 'types/upstream/ast.ts');
const ast = fs.readFileSync(astPath, 'utf8');
const sf = ts.createSourceFile(astPath, ast, ts.ScriptTarget.Latest, true);

const requiredKinds = [
  'expression_ast','model_ast','resource_ast','request_ast','route_ast','controller_ast',
  'response_ast','service_ast','migration_ast','dto_ast','middleware_ast','provider_ast',
  'attribute_ast','channel_ast',
];
const requiredFields = ['identity','semantic','evidence','provenance','constraints','dependencies','derivation','status'];
const requiredDerivation = ['conclusion','premises','round','rule','witness'];
const requiredEvidence = ['surface','facts'];
const requiredStatus = ['ast_candidate','ast_resolved','ast_ambiguous','ast_rejected'];

function hasText(value) { return ast.includes(value); }
const schemaKinds = requiredKinds.filter(k => new RegExp(`readonly\\s+${k}\\s*:`).test(ast));
const interfaceFields = requiredFields.filter(k => new RegExp(`readonly\\s+${k}\\s*:`).test(ast));
const derivationFields = requiredDerivation.filter(k => new RegExp(`readonly\\s+${k}\\s*:`).test(ast));
const evidenceFields = requiredEvidence.filter(k => new RegExp(`readonly\\s+${k}\\s*:`).test(ast));
const statusKinds = requiredStatus.filter(k => hasText(`kind: '${k}'`));

let semanticGeneric = false;
function visit(node) {
  if (ts.isTypeAliasDeclaration(node) && node.name.text === 'SemanticAstNode') {
    semanticGeneric = !!node.typeParameters && node.typeParameters.length > 1;
  }
  ts.forEachChild(node, visit);
}
visit(sf);

const scope = [
  'compiler/scanner',
  'graph',
  'compiler/analysis',
  'compiler/domain/common/ts-lowerer',
];
const files=[];
function walk(dir){
  for(const e of fs.readdirSync(dir,{withFileTypes:true})){
    const p=path.join(dir,e.name);
    if(e.isDirectory()) walk(p); else if(e.name.endsWith('.ts')) files.push(p);
  }
}
for(const rel of scope) walk(path.join(root, rel));
const counts=()=>({if:0,while:0,for:0,switch:0,map:0,filter:0,reduce:0,flatMap:0,undefined:0,null:0,nullish:0,strictEq:0,strictNeq:0,asUnknown:0,Set:0,Map:0,any:0,new:0});
function audit(file){
  const source=fs.readFileSync(file,'utf8'); const tree=ts.createSourceFile(file,source,ts.ScriptTarget.Latest,true); const c=counts();
  function v(n){
    if(ts.isIfStatement(n)) c.if++;
    if(ts.isWhileStatement(n)) c.while++;
    if(ts.isForStatement(n)||ts.isForInStatement(n)||ts.isForOfStatement(n)) c.for++;
    if(ts.isSwitchStatement(n)) c.switch++;
    if(ts.isNewExpression(n)) c.new++;
    if(ts.isAsExpression(n)&&n.type.kind===ts.SyntaxKind.UnknownKeyword)c.asUnknown++;
    if(ts.isBinaryExpression(n)){const o=n.operatorToken.kind;if(o===ts.SyntaxKind.EqualsEqualsEqualsToken)c.strictEq++;if(o===ts.SyntaxKind.ExclamationEqualsEqualsToken)c.strictNeq++;if(o===ts.SyntaxKind.QuestionQuestionToken)c.nullish++;}
    if(ts.isConditionalExpression(n)) c.ternary=(c.ternary||0)+1;
    if(ts.isCallExpression(n)&&ts.isPropertyAccessExpression(n.expression)){const name=n.expression.name.text;if(name in {map:1,filter:1,reduce:1,flatMap:1})c[name]++;}
    if(n.kind===ts.SyntaxKind.UndefinedKeyword||(ts.isIdentifier(n)&&n.text==='undefined'))c.undefined++;
    if(n.kind===ts.SyntaxKind.NullKeyword)c.null++;
    if(n.kind===ts.SyntaxKind.AnyKeyword)c.any++;
    if(ts.isIdentifier(n)&&n.text==='Set')c.Set++;
    if(ts.isIdentifier(n)&&n.text==='Map')c.Map++;
    ts.forEachChild(n,v);
  } v(tree); return c;
}
const rows=files.map(f=>({file:path.relative(root,f),counts:audit(f)}));
const aggregate=rows.reduce((a,r)=>{for(const k of Object.keys(r.counts))a[k]=(a[k]||0)+r.counts[k];return a},{});
const zeroByte=files.filter(f=>fs.statSync(f).size===0).map(f=>path.relative(root,f));
const report={
  phase:653,
  model:'closed-schema proof-carrying semantic attributed AST judgment',
  interface:{
    schemaComplete:schemaKinds.length===requiredKinds.length,
    schemaKinds,
    requiredKinds,
    requiredFields,
    interfaceFields,
    requiredFieldsComplete:interfaceFields.length===requiredFields.length,
    evidenceFields,
    evidenceComplete:evidenceFields.length===requiredEvidence.length,
    derivationFields,
    derivationComplete:derivationFields.length===requiredDerivation.length,
    statusKinds,
    statusComplete:statusKinds.length===requiredStatus.length,
    openPayloadGenerics:semanticGeneric,
    closedPayloadSchema:!semanticGeneric,
  },
  scope:{files:files.length,aggregate,top:rows.sort((a,b)=>Object.values(b.counts).reduce((x,y)=>x+y,0)-Object.values(a.counts).reduce((x,y)=>x+y,0)).slice(0,20)},
  inactiveVacuum:{zeroByteProductionFiles:zeroByte},
  verification:'AST interface parsed with global TypeScript compiler; workspace-wide tsc remains blocked by missing @types/node and vitest/globals.'
};
fs.writeFileSync('docs/PHASE653_AST_INTERFACE_MAXIMUM_AUDIT.json',JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify(report,null,2));
process.exit(report.interface.schemaComplete&&report.interface.requiredFieldsComplete&&report.interface.evidenceComplete&&report.interface.derivationComplete&&report.interface.statusComplete&&!report.interface.openPayloadGenerics?0:1);
