#!/usr/bin/env node
'use strict';
const fs=require('fs');
const path=require('path');
const cp=require('child_process');
const ts=require('typescript');

const root=path.resolve(process.argv[2]||process.cwd());
const abs=p=>path.isAbsolute(p)?p:path.join(root,p);
const exists=p=>fs.existsSync(abs(p));
const read=p=>exists(p)?fs.readFileSync(abs(p),'utf8'):'';
const rel=p=>path.relative(root,p).replaceAll(path.sep,'/');
const walk=(dir,out=[])=>{if(!fs.existsSync(dir))return out;for(const e of fs.readdirSync(dir,{withFileTypes:true})){if(['node_modules','dist','.git'].includes(e.name))continue;const p=path.join(dir,e.name);e.isDirectory()?walk(p,out):out.push(p)}return out};
const tsFiles=walk(abs('packages/core/src')).filter(f=>f.endsWith('.ts'));
const program=ts.createProgram(tsFiles,{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.NodeNext,moduleResolution:ts.ModuleResolutionKind.NodeNext,skipLibCheck:true,noEmit:true,allowJs:false});
const checker=program.getTypeChecker();
const scannerFiles=tsFiles.filter(f=>/compiler\/scanner\//.test(rel(f)));
const parse=f=>ts.createSourceFile(f,fs.readFileSync(f,'utf8'),ts.ScriptTarget.Latest,true,ts.ScriptKind.TS);
const line=(sf,n)=>sf.getLineAndCharacterOfPosition(n.getStart(sf)).line+1;
const add=(findings,severity,kind,detail,repair)=>findings.push({severity,kind,detail,repair});
const findings=[];
const expected=['models','resources','requests','routes','controllers','services','migrations','responses','dtos','middlewares','providers','attributes','channels'];
const scannerNames=['ModelScanner','FormRequestScanner','ControllerScanner','ResourceScanner','RouteScanner','ChannelScanner'];
const sourceAstPath='packages/core/src/types/upstream/collections.ts';
const astPath='packages/core/src/types/upstream/ast.ts';
const highPath='packages/core/src/types/upstream/highLevelSourceModel.ts';
const sourceScannerPath='packages/core/src/compiler/scanner/orchestrator/sourceAstScanner.ts';
const manifestPath='packages/core/src/compiler/scanner/orchestrator/upstreamManifestScanner.ts';

function collectCalls(file){
  const sf=parse(file),out=[];
  function visit(n){
    if(ts.isCallExpression(n))out.push({callee:n.expression.getText(sf),line:line(sf,n),args:n.arguments.map(a=>a.getText(sf))});
    ts.forEachChild(n,visit);
  }
  visit(sf);return out;
}
function typeAliases(file){
  if(!exists(file))return [];
  const sf=parse(file),out=[];
  function visit(n){
    if(ts.isTypeAliasDeclaration(n))out.push(n);
    ts.forEachChild(n,visit);
  }
  visit(sf);return out;
}
function literalFields(typeNode,sf){
  if(!typeNode||!ts.isTypeLiteralNode(typeNode))return [];
  return typeNode.members.filter(ts.isPropertySignature).map(m=>({name:m.name.getText(sf).replace(/^['"]|['"]$/g,''),type:m.type?.getText(sf)||'unknown'}));
}
function aliasInfo(file,name){
  if(!exists(file))return null;
  const sf=program.getSourceFile(file)||parse(file);let found=null;
  function visit(n){if(found)return;if(ts.isTypeAliasDeclaration(n)&&n.name.text===name)found={name,type:n.type,fields:literalFields(n.type,sf),line:line(sf,n)};else ts.forEachChild(n,visit)}
  visit(sf);return found;
}
function resolveAliasFields(aliasName,files,seen=new Set()){
  if(seen.has(aliasName))return [];
  seen.add(aliasName);
  for(const f of files){const info=aliasInfo(f,aliasName);if(info){const out=[...info.fields.map(x=>x.name)];for(const x of info.fields){const m=x.type.match(/^(?:readonly\s+)?([A-Za-z_$][\w$]*)/);if(m)out.push(...resolveAliasFields(m[1],files,new Set(seen)));}return [...new Set(out)];}}
  return [];
}
function declarationMap(file){
  const sf=program.getSourceFile(file)||parse(file),out=new Map();
  function visit(n){if(ts.isTypeAliasDeclaration(n))out.set(n.name.text,{node:n,sf});ts.forEachChild(n,visit)}visit(sf);return out;
}

function methodMap(file){
  const sf=program.getSourceFile(file)||parse(file),out=[];
  function visit(n){
    if(ts.isMethodDeclaration(n)&&n.name){
      out.push({name:n.name.getText(sf),node:n,sf,signature:checker.getSignatureFromDeclaration(n),line:line(sf,n)});
    }
    ts.forEachChild(n,visit);
  }
  visit(sf); return out;
}
function calledScannerNames(n,sf){
  const out=[];
  function visit(x){
    if(ts.isCallExpression(x)){
      const text=x.expression.getText(sf);
      const m=/^(\w+Scanner)\.(scan|scanAsts|scanCanonicalAsts)$/.exec(text);
      if(m) out.push({scanner:m[1],method:m[2],line:line(sf,x),args:x.arguments.map(a=>a.getText(sf))});
    }
    ts.forEachChild(x,visit);
  }
  visit(n); return out;
}
function returnedExpressionKinds(method){
  const out=[];
  if(!method.body)return out;
  function visit(n){
    if(ts.isReturnStatement(n)&&n.expression){
      const e=n.expression;
      out.push({text:e.getText(method.sf),line:line(method.sf,n),type:checker.typeToString(checker.getTypeAtLocation(e),e,ts.TypeFormatFlags.NoTruncation),kind:
        ts.isCallExpression(e)?'call':ts.isIdentifier(e)?'identifier':ts.isArrayLiteralExpression(e)?'array':ts.isAwaitExpression(e)?'await':ts.SyntaxKind[e.kind]});
      return;
    }
    if(n!==method.node.body&&(ts.isFunctionExpression(n)||ts.isArrowFunction(n)||ts.isMethodDeclaration(n)))return;
    ts.forEachChild(n,visit);
  }
  visit(method.node.body); return out;
}

// A. Canonical vocabulary.
let sourceAstProps=[];
if(exists(sourceAstPath)){
  const sf=parse(abs(sourceAstPath));
  function visit(n){if(ts.isTypeAliasDeclaration(n)&&n.name.text==='SourceAsts')sourceAstProps=literalFields(n.type,sf).map(x=>x.name);ts.forEachChild(n,visit)}
  visit(sf);
}else add(findings,'critical','workspace_model_missing','Canonical SourceAsts declaration is missing.','Restore the existing upstream SourceAsts model; do not create a parallel collection.');
const missingCategories=expected.filter(x=>!sourceAstProps.includes(x));
const extraCategories=sourceAstProps.filter(x=>!expected.includes(x));
if(missingCategories.length)add(findings,'critical','source_asts_category_gap',{missing:missingCategories,present:sourceAstProps},'Complete the existing SourceAsts vocabulary before downstream interpretation.');
if(extraCategories.length)add(findings,'high','source_asts_unexpected_category',{extra:extraCategories},'Align the trace vocabulary with the canonical SourceAsts ADT.');

// B. Completeness vocabulary.
const compText=read('packages/core/src/types/upstream/completeness.ts');
const compKinds=[...compText.matchAll(/kind:\s*['"]([a-z_]+)['"]/g)].map(m=>m[1]);
const expectedSingular=expected.map(x=>x.endsWith('ies')?x.slice(0,-3)+'y':x.endsWith('s')?x.slice(0,-1):x);
const completenessMissing=expectedSingular.filter(x=>!compKinds.includes(x));
if(completenessMissing.length)add(findings,'critical','completeness_category_gap',{missing:completenessMissing},'Add every SourceAsts category to the existing completeness ADT and validator.');
if(/discovered_empty/.test(compText)&&!/discovered_empty/.test(read(sourceScannerPath)))add(findings,'high','empty_discovery_policy_gap','Completeness mentions discovered_empty but the source boundary does not expose a category-specific proof policy.','Make empty discovery an explicit proof state, not an implicit valid scan.');

// C. Canonical AST declarations and producers.
const astMap=declarationMap(abs(astPath));
const astDecls=[];
for(const [name,v] of astMap){if(/Ast$/.test(name)&&name!=='CompleteSourceAst'&&name!=='SourceAst'){const fields=literalFields(v.node.type,v.sf);astDecls.push({type:name,fields,kind:fields.find(x=>x.name==='kind')?.type||null,line:v.sf.getLineAndCharacterOfPosition(v.node.getStart(v.sf)).line+1});if(!fields.some(x=>x.name==='source'))add(findings,'critical','ast_without_provenance',{type:name},'Retain canonical SourceSpan provenance on every source AST node.');}}
const construction=[];
for(const d of astDecls){const hits=[];for(const f of scannerFiles){const sf=parse(f);function visit(n){if(ts.isObjectLiteralExpression(n)){const k=n.properties.find(p=>ts.isPropertyAssignment(p)&&p.name.getText(sf)==='kind');if(k&&d.kind&&k.initializer.getText(sf).replace(/['"]/g,'')===d.kind.replace(/^['"]|['"]$/g,''))hits.push({file:rel(f),line:line(sf,n)});}ts.forEachChild(n,visit)}visit(sf)}construction.push({...d,producers:hits});if(!hits.length)add(findings,'critical','adt_construction_unproven',d,'Prove the canonical producer or mark this category UNPROVEN.');}

// D. Actual return-type proof: a canonical *Ast method must return the declared ADT, not a legacy descriptor with a widened annotation.
const returnTypeMismatches=[];
for(const f of scannerFiles){
  const sf=program.getSourceFile(f); if(!sf) continue;
  function visit(n){
    if(ts.isMethodDeclaration(n) && /scanAsts|scanCanonicalAsts/.test(n.name.getText(sf)) && n.body){
      const declared=checker.getSignatureFromDeclaration(n)?.getReturnType();
      if(declared){
        const returns=[];
        function scanReturn(x){
          if(ts.isReturnStatement(x)&&x.expression){returns.push(x.expression);return;}
          if(x!==n.body && (ts.isFunctionDeclaration(x)||ts.isFunctionExpression(x)||ts.isArrowFunction(x)||ts.isMethodDeclaration(x)||ts.isGetAccessorDeclaration(x)||ts.isSetAccessorDeclaration(x)))return;
          ts.forEachChild(x,scanReturn);
        }
        scanReturn(n.body);
        for(const expr of returns){
          const actual=checker.getTypeAtLocation(expr);
          const declaredString=checker.typeToString(declared,n,ts.TypeFormatFlags.NoTruncation);
          const isPromise=declared.getSymbol()?.getName()==='Promise' || declaredString.startsWith('Promise<');
          const expectedInner=isPromise && declared.typeArguments?.length ? declared.typeArguments[0] : declared;
          const assignable=checker.isTypeAssignableTo(actual,expectedInner)||checker.isTypeAssignableTo(actual,declared);
          const declaredName=checker.typeToString(expectedInner,n,ts.TypeFormatFlags.NoTruncation);
          const actualName=checker.typeToString(actual,expr,ts.TypeFormatFlags.NoTruncation);
          if(!assignable){
            const item={file:rel(f),method:n.name.getText(sf),line:line(sf,expr),declared:declaredName,actual:actualName};
            returnTypeMismatches.push(item);
            add(findings,'critical','ast_return_type_mismatch',item,'Construct the canonical ADT before returning; never widen a legacy descriptor to the new AST interface.');
          }
        }
      }
    }
    ts.forEachChild(n,visit);
  }
  visit(sf);
}

// D. Internal PHP AST evidence. Do not require php-ast extension when the repository has its own ADT producer.
const lexerFiles=tsFiles.filter(f=>/compiler\/scanner\/lexer\//.test(rel(f)));
const lexerText=lexerFiles.map(f=>read(rel(f))).join('\n');
const internalPhpAst={tokenizer:/export\s+(?:function|const)\s+tokenizePhpSource|function\s+tokenizePhpSource/.test(lexerText),classifier:/export\s+(?:function)\s+classifyPhpBlock/.test(lexerText)&&/classifyAstTokens/.test(lexerText),factory:/class\s+PhpAstFactory/.test(lexerText),algebra:/matchPhpAstValue/.test(lexerText)};
const internalAstCapable=Object.values(internalPhpAst).every(Boolean);
const phpFiles=walk(abs('examples/ecommerce-shop-source')).filter(f=>f.endsWith('.php'));
let syntaxFailures=[];
for(const f of phpFiles){try{cp.execFileSync('php',['-l',f],{stdio:['ignore','pipe','pipe']});}catch{syntaxFailures.push(rel(f));}}
if(syntaxFailures.length)add(findings,'critical','php_source_syntax_failure',{count:syntaxFailures.length,files:syntaxFailures.slice(0,20)},'Fix PHP syntax before trusting source evidence.');
if(!internalAstCapable)add(findings,'critical','php_ast_producer_unproven',{internalPhpAst},'Establish the repository PHP lexer -> AST -> ADT producer before semantic scanning.');
let phpAstUsage=[];
for(const f of scannerFiles){const text=read(rel(f));if(/classifyPhpBlock|classifyAstTokens|LaravelSourceLexer/.test(text))phpAstUsage.push({file:rel(f),line:(text.match(/classifyPhpBlock|classifyAstTokens|LaravelSourceLexer/)||[]).index});}
if(internalAstCapable&&!phpAstUsage.length)add(findings,'critical','php_ast_not_consumed',{internalPhpAst},'The internal PHP AST exists but no scanner consumption path is proven.');

// D2. Source inventory coverage contract. Static scanner path evidence must explain every Laravel
// source family that the canonical SourceAsts vocabulary claims to represent.
const sourceFamilies={
  models:'app/Models',resources:'app/Http/Resources',requests:'app/Http/Requests',routes:'routes',controllers:'app/Http/Controllers',
  services:'app/Services',migrations:'database/migrations',responses:'app/Http/Responses',dtos:'app/Http/DTOs',middlewares:'app/Http/Middleware',providers:'app/Providers',attributes:'app/Attributes',channels:'routes/channels'
};
const sourceCoverage=[];
for(const category of expected){
  const dir=sourceFamilies[category];
  if(!dir) { sourceCoverage.push({category,status:'UNPROVEN',reason:'no source-family mapping'}); continue; }
  const files=walk(abs('examples/ecommerce-shop-source/'+dir)).filter(f=>/\.(php)$/.test(f));
  const categoryScanner= scannerFiles.filter(f=>new RegExp(`/${category.replace(/s$/,'')}.*(Scanner|Canonical)|${category}Scanner`,'i').test(rel(f))).map(rel);
  const scannerAstEvidence=categoryScanner.map(f=>read(f)).filter(t=>/LaravelSourceLexer\.(tokenize|parseArray)|PhpAstFactory|classifyAstTokens/.test(t)).length;
  sourceCoverage.push({category,sourceDir:dir,phpFiles:files.length,scannerEvidence:categoryScanner,astConsumerEvidence:scannerAstEvidence,status:categoryScanner.length?'PRESENT':'UNPROVEN'});
  if(files.length&&!categoryScanner.length)add(findings,'critical','source_family_uncovered',{category,sourceDir:dir,phpFiles:files.length},'Prove the existing canonical scanner for this source family or make the category explicitly UNPROVEN.');
}

// E0. Exact scanner delegate/return proof. A canonical *Ast method that delegates to a legacy scanner
// is a semantic downgrade even when its TypeScript annotation says otherwise.
const delegateMismatches=[];
for(const f of scannerFiles){
  const methods=methodMap(f);
  for(const m of methods){
    if(!/scanAsts|scanCanonicalAsts/.test(m.name)) continue;
    if(!m.node.body) continue;
    const legacyVariables=new Map();
    const ownerClass=(()=>{let x=m.node.parent; while(x&&!ts.isClassDeclaration(x))x=x.parent; return x&&x.name?x.name.text:null;})();
    function scanStatements(n){
      if(ts.isCallExpression(n)){
        const callee=n.expression.getText(m.sf);
        if(ownerClass && callee===`${ownerClass}.scan`){
          const item={file:rel(f),method:m.name,line:line(m.sf,n),legacyExpression:n.getText(m.sf),legacyType:checker.typeToString(checker.getTypeAtLocation(n),n,ts.TypeFormatFlags.NoTruncation)};
          if(!delegateMismatches.some(x=>x.file===item.file&&x.method===item.method&&x.legacyExpression===item.legacyExpression)){
            delegateMismatches.push(item);
            add(findings,'critical','canonical_method_delegates_legacy_scan',item,'Canonical AST methods must not invoke their legacy scanner; interpret the source once and build the canonical ADT directly.');
          }
        }
      }
      if(ts.isVariableDeclaration(n)&&n.initializer){
        const init=n.initializer;
        const text=init.getText(m.sf);
        if(/(?:Scanner)\.(?:scan)\s*\(/.test(text)){
          legacyVariables.set(n.name.getText(m.sf),{line:line(m.sf,n),expression:text,type:checker.typeToString(checker.getTypeAtLocation(init),init,ts.TypeFormatFlags.NoTruncation)});
        }
      }
      if(ts.isReturnStatement(n)&&n.expression&&ts.isIdentifier(n.expression)){
        const name=n.expression.text;
        const origin=legacyVariables.get(name);
        if(origin){
          const item={file:rel(f),method:m.name,line:line(m.sf,n),returnedVariable:name,legacyExpression:origin.expression,legacyType:origin.type};
          delegateMismatches.push(item);
          add(findings,'critical','canonical_method_delegates_legacy_scan',item,'Construct the canonical ADT directly; do not return a legacy scanner result through an intermediate variable.');
        }
      }
      ts.forEachChild(n,scanStatements);
    }
    scanStatements(m.node.body);
  }
}
// E1. Scanner call graph: record every scanner-to-scanner edge, including non-projectRoot calls.
const scannerCallGraph=[];
for(const f of scannerFiles){
  const sf=program.getSourceFile(f); if(!sf) continue;
  for(const m of methodMap(f)){
    for(const c of calledScannerNames(m.node,m.sf)){
      scannerCallGraph.push({from:rel(f),method:m.name,to:`${c.scanner}.${c.method}`,line:c.line,args:c.args});
    }
  }
}
const semanticReopenEdges=scannerCallGraph.filter(x=>/\.scan$|\.scanAsts$|\.scanCanonicalAsts$/.test(x.to)&&x.args.some(a=>/projectRoot|root|sourcePath/.test(a)));
for(const e of semanticReopenEdges){
  const isOrigin=/compiler\/scanner\/orchestrator\/(sourceAstScanner|pipelineScanner|upstreamManifestScanner)\.ts$/.test(e.from);
  if(!isOrigin)add(findings,'critical','scanner_graph_reopens_source',e,'Remove source reopening from scanner graph; pass canonical upstream data instead.');
}
// Deduplicate delegate evidence: one legacy call site = one proven finding.
const uniqueDelegateMismatches=[];
for(const item of delegateMismatches){
  if(!uniqueDelegateMismatches.some(x=>x.file===item.file&&x.method===item.method&&x.legacyExpression===item.legacyExpression))uniqueDelegateMismatches.push(item);
}
delegateMismatches.length=0; delegateMismatches.push(...uniqueDelegateMismatches);

// E. Scanner rescan graph: every scanner call receiving projectRoot outside the explicit origin orchestrator is a semantic reopening.
const projectRootScannerCalls=[];
for(const f of scannerFiles){for(const c of collectCalls(f)){const m=/^(\w+Scanner)\.(scan|scanAsts|scanCanonicalAsts)$/.exec(c.callee);if(!m||!c.args.some(a=>a.includes('projectRoot')))continue;const owner=rel(f);const origin=/compiler\/scanner\/orchestrator\/(sourceAstScanner|pipelineScanner|upstreamManifestScanner)\.ts$/.test(owner);const item={file:owner,callee:c.callee,line:c.line,originOrchestrator:origin};projectRootScannerCalls.push(item);if(!origin)add(findings,'critical','nested_project_root_rescan',item,'Pass canonical upstream AST/model data; do not reopen projectRoot after the origin boundary.');}}
const sourceCalls=exists(sourceScannerPath)?collectCalls(abs(sourceScannerPath)):[];
const hiddenRescans=[];
for(const name of scannerNames){const canonical=sourceCalls.filter(x=>x.callee===`${name}.scanAsts`||x.callee===`${name}.scanCanonicalAsts`);const legacy=sourceCalls.filter(x=>x.callee===`${name}.scan`);if(canonical.length&&legacy.length){const item={scanner:name,canonical:canonical.map(x=>x.line),legacy:legacy.map(x=>x.line)};hiddenRescans.push(item);add(findings,'critical','hidden_rescan_after_ast',item,'Use one authoritative interpretation for each source category.');}}
const pipelinePath='packages/core/src/compiler/scanner/orchestrator/pipelineScanner.ts';
const pipelineCalls=exists(pipelinePath)?collectCalls(abs(pipelinePath)):[];
const pipelineRescans=[];
for(const name of scannerNames){const hits=pipelineCalls.filter(x=>x.callee===`${name}.scan`&&x.args.some(a=>a.includes('projectRoot')));if(hits.length){const item={scanner:name,lines:hits.map(x=>x.line)};pipelineRescans.push(item);add(findings,'critical','pipeline_rescan_after_ast',item,'Pipeline must consume the canonical SourceAsts/high-level model.');}}

// F. High-level model -> canonical AST field-loss analysis.
// This is deliberately fail-closed: absence of a proven semantic-node producer/consumer is UNPROVEN,
// not "zero field loss". Compare actual nested property vocabulary, not only top-level names.
const mappings={
  ModelSemanticNode:{facts:'ModelFacts',ast:'ModelAst',factsFile:'modelSourceFacts.ts',astDefinition:'definition'},
  ResourceSemanticNode:{facts:'ResourceFacts',ast:'ResourceAst',factsFile:'resource.ts',astDefinition:'definition'},
  RequestSemanticNode:{facts:'RequestFacts',ast:'RequestAst',factsFile:'request.ts',astDefinition:'definition'},
  ResponseSemanticNode:{facts:'ResponseFacts',ast:'ResponseAst',factsFile:'response.ts',astDefinition:'definition'},
  RouteSemanticNode:{facts:'RouteFacts',ast:'RouteAst',factsFile:'route.ts',astDefinition:'definition'}
};
function typePropertyTree(type,checker,depth=0,seen=new Set(),prefix=''){
  if(!type||depth>5)return [];
  const id=type.id ?? `${checker.typeToString(type)}:${depth}`;
  if(seen.has(id))return []; seen.add(id);
  const out=[];
  for(const prop of type.getProperties()){
    const name=prop.name;
    const full=prefix?`${prefix}.${name}`:name;
    out.push(full);
    const pt=checker.getTypeOfSymbolAtLocation(prop, undefined);
    if(pt && pt.getProperties().length) out.push(...typePropertyTree(pt,checker,depth+1,seen,full));
  }
  return out;
}
function typeInfoByName(name,file){
  if(!exists(file))return null;
  const sf=program.getSourceFile(file)||parse(file);let found=null;
  function visit(n){
    if(found)return;
    if((ts.isTypeAliasDeclaration(n)||ts.isInterfaceDeclaration(n))&&n.name.text===name)found={node:n,sf};
    else ts.forEachChild(n,visit);
  }
  visit(sf);return found;
}
const allCoreFiles=tsFiles;
function hasSemanticProducer(nodeName){
  const producers=[];
  for(const f of allCoreFiles){
    const sf=program.getSourceFile(f); if(!sf) continue;
    function visit(n){
      if(ts.isObjectLiteralExpression(n)){
        const k=n.properties.find(p=>ts.isPropertyAssignment(p)&&p.name.getText(sf)==='kind');
        if(k && k.initializer.getText(sf).replace(/['"]/g,'')===nodeName.replace(/SemanticNode/,'').replace(/^./,m=>m.toLowerCase())+'_semantic_node')
          producers.push({file:rel(f),line:line(sf,n),kind:'object_literal'});
      }
      if(ts.isFunctionDeclaration(n)||ts.isMethodDeclaration(n)||ts.isFunctionExpression(n)||ts.isArrowFunction(n)){
        const sig=checker.getSignatureFromDeclaration(n);
        if(sig){
          const rt=checker.getReturnTypeOfSignature(sig);
          const name=rt.getSymbol()?.getName?.()||'';
          if(name===nodeName)producers.push({file:rel(f),line:line(sf,n),kind:'return_type'});
        }
      }
      ts.forEachChild(n,visit);
    }
    visit(sf);
  }
  return producers;
}
function semanticConsumption(nodeName){
  const consumers=[];
  for(const f of allCoreFiles){
    const sf=program.getSourceFile(f); if(!sf) continue;
    function visit(n){
      if(ts.isTypeReferenceNode(n)&&n.typeName.getText(sf)===nodeName){
        const parent=n.parent;
        const isDefinition=ts.isTypeAliasDeclaration(parent)||ts.isInterfaceDeclaration(parent);
        if(!isDefinition)consumers.push({file:rel(f),line:line(sf,n),kind:'type_reference'});
      }
      ts.forEachChild(n,visit);
    }
    visit(sf);
  }
  return consumers;
}
const fieldLoss=[];
for(const [node,cfg] of Object.entries(mappings)){
  const factsInfo=typeInfoByName(cfg.facts,abs('packages/core/src/types/upstream/'+cfg.factsFile));
  const astInfo=astMap.get(cfg.ast);
  const factsType=factsInfo?checker.getTypeAtLocation(ts.isTypeAliasDeclaration(factsInfo.node)?factsInfo.node.type:factsInfo.node):null;
  const astType=astInfo?checker.getTypeAtLocation(astInfo.node.type):null;
  const semanticFields=factsType?typePropertyTree(factsType,checker):[];
  const canonicalFields=astType?typePropertyTree(astType,checker):[];
  const canonicalSet=new Set(canonicalFields.map(x=>x.split('.').pop()));
  const missing=semanticFields.filter(f=>!canonicalSet.has(f.split('.').pop()));
  const producers=hasSemanticProducer(node);
  const consumers=semanticConsumption(node);
  const provenConnection=producers.length>0 && consumers.length>0;
  const item={node,facts:cfg.facts,ast:cfg.ast,semanticFields,canonicalFields,missing,producerCount:producers.length,producers:producers.slice(0,20),consumerCount:consumers.length,consumers:consumers.slice(0,20),provenConnection};
  fieldLoss.push(item);
  if(!provenConnection)add(findings,'critical','semantic_lineage_unproven',{node,producerCount:producers.length,consumerCount:consumers.length},'Prove an actual producer and consumer for the existing high-level semantic node before claiming field preservation.');
  if(missing.length){
    if(provenConnection)add(findings,'critical','semantic_field_loss_risk',item,'Carry the missing semantic facts through the existing canonical AST at the first proven loss location.');
    else add(findings,'critical','semantic_field_mapping_unproven',{node,missing,semanticFields,canonicalFields},'Treat these as candidate gaps only; first connect the existing semantic node, then confirm whether each fact is actually lost.');
  }
}

// G. Prove the high-level model is connected by actual construction/consumption, not a text reference.
const highLevelRefs=Object.keys(mappings).map(node=>{
  const producers=hasSemanticProducer(node);
  const consumers=semanticConsumption(node);
  return {type:node,producerCount:producers.length,consumerCount:consumers.length,producers:producers.slice(0,10),consumers:consumers.slice(0,10),referenced:producers.length>0&&consumers.length>0};
});
for(const item of highLevelRefs)if(!item.referenced)add(findings,'critical','high_level_model_unconnected',item,'Connect the existing high-level model at the origin boundary without creating a parallel interface.');

// H. Manifest chain.
const manifestText=read(manifestPath);
const manifestProof={sourceScannerCalls:/scanSourceAsts\s*\(/.test(manifestText),completenessCall:/validateCompleteSourceAst\s*\(/.test(manifestText),returnsRouteSyncManifest:/Promise<RouteSyncManifest>/.test(manifestText)};
if(!manifestProof.sourceScannerCalls||!manifestProof.completenessCall||!manifestProof.returnsRouteSyncManifest)add(findings,'critical','manifest_lineage_gap',manifestProof,'Make SourceAsts -> completeness proof -> RouteSyncManifest an explicit canonical boundary.');
const manifestRefs=[];
for(const f of [...tsFiles,...walk(abs('packages/cli/src')).filter(x=>x.endsWith('.ts'))]){const t=read(rel(f));if(/scanRouteSyncManifest\s*\(/.test(t)||/ManifestGenerator\.save\s*\(/.test(t))manifestRefs.push({file:rel(f),scan:/scanRouteSyncManifest\s*\(/.test(t),save:/ManifestGenerator\.save\s*\(/.test(t)});}
if(!manifestRefs.some(x=>x.scan))add(findings,'critical','manifest_scan_producer_unproven',manifestRefs,'Prove the executable manifest producer chain.');

// I. Provenance and competing vocabularies.
if(!/export\s+type\s+SourceSpan/.test(read('packages/core/src/types/upstream/provenance.ts')))add(findings,'critical','provenance_model_missing',{},'Use the canonical SourceSpan model.');
const nullabilityFiles=tsFiles.filter(f=>/export\s+type\s+Nullability\s*=/.test(read(rel(f)))).map(rel);
if(nullabilityFiles.length>1)add(findings,'high','competing_nullability_vocabulary',{files:nullabilityFiles},'Consolidate Nullability into the canonical upstream vocabulary.');

// J. Free semantic data and fallback, but retain evidence location.
const freeData=[];
for(const f of tsFiles){const r=rel(f);if(!/types\/upstream|compiler\/scanner|compiler\/passes/.test(r))continue;const lines=read(r).split('\n');lines.forEach((s,i)=>{if(/\bRecord\s*</.test(s))freeData.push({kind:'record',file:r,line:i+1,evidence:s.trim()});if(/semanticType|primKind|responseType|resourceType|modelType|requestType|schemaType/.test(s)&&/\?\?|\|\|/.test(s))freeData.push({kind:'semantic_fallback',file:r,line:i+1,evidence:s.trim()});});}
if(freeData.length)add(findings,'high','free_semantic_data',freeData,'Move semantic meaning into the existing upstream ADT/model and eliminate fallback reconstruction.');


// K0. Symbol-level semantic lineage. Text/name occurrence is insufficient: prove that a
// high-level semantic value can actually flow from a producer into an existing canonical AST.
// This pass resolves identifiers through the TypeScript checker and records assignment/argument/return edges.
function symbolNameAt(node,sf){
  const sym=checker.getSymbolAtLocation(node);
  return sym?.getName?.()||null;
}
function expressionSemanticType(node){
  const t=checker.getTypeAtLocation(node);
  const sym=t?.getSymbol?.();
  return sym?.getName?.()||checker.typeToString(t,node,ts.TypeFormatFlags.NoTruncation);
}
function collectSemanticSymbols(){
  const result=new Map();
  for(const node of Object.keys(mappings)){
    const refs=[];
    for(const f of allCoreFiles){
      const sf=program.getSourceFile(f); if(!sf) continue;
      function visit(n){
        if(ts.isIdentifier(n) && n.text===node){
          const sym=checker.getSymbolAtLocation(n);
          if(sym) refs.push({file:rel(f),line:line(sf,n),symbol:sym.getName(),kind:'identifier'});
        }
        ts.forEachChild(n,visit);
      }
      visit(sf);
    }
    result.set(node,refs);
  }
  return result;
}
function traceMethodFlow(method){
  const edges=[];
  if(!method.node.body)return edges;
  const variables=new Map();
  function visit(n){
    if(ts.isVariableDeclaration(n)&&n.name&&ts.isIdentifier(n.name)&&n.initializer){
      const name=symbolNameAt(n.name,method.sf);
      variables.set(name||n.name.text,{expression:n.initializer,line:line(method.sf,n),symbol:name||n.name.text});
    }
    if(ts.isBinaryExpression(n)&&n.operatorToken.kind===ts.SyntaxKind.EqualsToken&&ts.isIdentifier(n.left)){
      const left=symbolNameAt(n.left,method.sf)||n.left.text;
      edges.push({kind:'assignment',from:expressionSemanticType(n.right),to:left,file:rel(method.sf.fileName),line:line(method.sf,n),expression:n.getText(method.sf)});
    }
    if(ts.isCallExpression(n)){
      n.arguments.forEach((arg,i)=>{
        if(ts.isIdentifier(arg)){
          edges.push({kind:'argument',from:symbolNameAt(arg,method.sf)||arg.text,to:n.expression.getText(method.sf),argument:i,file:rel(method.sf.fileName),line:line(method.sf,n)});
        }
      });
    }
    if(ts.isReturnStatement(n)&&n.expression){
      edges.push({kind:'return',from:expressionSemanticType(n.expression),to:method.name,file:rel(method.sf.fileName),line:line(method.sf,n),expression:n.expression.getText(method.sf)});
    }
    if(n!==method.node.body&&(ts.isFunctionExpression(n)||ts.isArrowFunction(n)||ts.isMethodDeclaration(n)))return;
    ts.forEachChild(n,visit);
  }
  visit(method.node.body); return edges;
}
const semanticFlow=[];
for(const f of allCoreFiles){
  const methods=methodMap(f);
  for(const m of methods){
    const edges=traceMethodFlow(m);
    for(const edge of edges){
      if(/SemanticNode|Facts|Ast$|Manifest|CompleteSourceAst/.test(edge.from+' '+edge.to)) semanticFlow.push(edge);
    }
  }
}
const semanticFlowByNode={};
for(const node of Object.keys(mappings)){
  semanticFlowByNode[node]=semanticFlow.filter(e=>String(e.from).includes(node)||String(e.to).includes(node)||String(e.expression||'').includes(node));
}
for(const node of Object.keys(mappings)){
  const flow=semanticFlowByNode[node];
  const existing=highLevelRefs.find(x=>x.type===node);
  const actualProducer=flow.some(e=>e.kind==='return' || e.kind==='assignment');
  const actualConsumer=flow.some(e=>e.kind==='argument' || e.kind==='assignment');
  if(existing && existing.producerCount>0 && existing.consumerCount>0 && !(actualProducer&&actualConsumer)){
    add(findings,'critical','semantic_symbol_lineage_unproven',{node,flowEdges:flow.slice(0,20)},'Resolve the semantic node through actual symbols and dataflow edges; type/name references alone are insufficient proof.');
  }
}

// K1. High-level model completeness: the auditor must inspect semantic dimensions, not merely
// whether a SemanticNode type exists. Missing dimensions are reported as candidates until actual lineage is proven.
const semanticDimensions=['identity','authorization','schema','model','response','fields','assignments','actions','endpoints','behavior','capabilities','exposure','surface','domain','endpoint','output','synthetic'];
const dimensionEvidence=[];
for(const [node,item] of Object.entries(Object.fromEntries(fieldLoss.map(x=>[x.node,x])))){
  const present=new Set(item.semanticFields.map(x=>x.split('.').pop()));
  const absent=semanticDimensions.filter(d=>!present.has(d));
  dimensionEvidence.push({node,present:[...present],candidateMissing:absent});
}

// K. Legacy evidence rejection.
const legacyRefs=[];for(const f of tsFiles){if(/routesync\.manifest\.json/.test(read(rel(f))))legacyRefs.push(rel(f));}
if(legacyRefs.length)add(findings,'critical','legacy_manifest_reference',legacyRefs,'Legacy manifest cannot prove fresh scanner lineage.');

// K2. Evidence confidence. A finding must state whether it is PROVEN, CANDIDATE, or UNPROVEN.
for(const f of findings){
  if(f.kind==='semantic_field_mapping_unproven'||f.kind==='semantic_lineage_unproven'||f.kind==='high_level_model_unconnected'||f.kind==='adt_construction_unproven'||f.kind==='manifest_lineage_gap')f.evidence='UNPROVEN';
  else if(f.kind==='semantic_field_loss_risk'||f.kind==='canonical_method_delegates_legacy_scan'||f.kind==='ast_return_type_mismatch'||f.kind==='nested_project_root_rescan'||f.kind==='pipeline_rescan_after_ast'||f.kind==='hidden_rescan_after_ast'||f.kind==='scanner_graph_reopens_source')f.evidence='PROVEN';
  else f.evidence='PROVEN';
}
// L. Fail-closed status.
const critical=findings.filter(x=>x.severity==='critical').length;
const high=findings.filter(x=>x.severity==='high').length;
const unprovenKinds=new Set(['adt_construction_unproven','php_ast_producer_unproven','php_ast_not_consumed','manifest_scan_producer_unproven','manifest_lineage_gap','semantic_lineage_unproven','high_level_model_unconnected']);
const unproven=findings.filter(x=>unprovenKinds.has(x.kind)).length;
const status=unproven?'UNPROVEN':critical?'REPAIR_REQUIRED':high?'REVIEW_REQUIRED':'CLEAN';
const report={schema:'routesync.data-loss-trace/v31',status,target:'Laravel ecommerce-shop -> repository PHP AST/ADT -> high-level upstream model -> canonical SourceAsts -> CompleteSourceAst -> RouteSyncManifest',method:{tsParser:'TypeScript Compiler API',phpAst:{internalRepositoryProducer:internalPhpAst,externalPhpAstExtensionNotRequired:true},failClosed:true,legacyManifestRejected:true,lineageChecks:['PHP syntax','internal PHP AST producer','AST consumer path','canonical SourceAsts vocabulary','completeness vocabulary','ADT declaration','ADT construction','actual return type proof','exact canonical delegate proof','scanner call graph','semantic field lineage, mapping, and loss','symbol-resolved semantic dataflow','semantic dimension coverage','source-family coverage','provenance','origin rescans','pipeline rescans','nested rescans','high-level model connection','manifest producer chain','competing vocabularies','semantic fallback/free data']},sourceEvidence:{project:'examples/ecommerce-shop-source',phpFiles:phpFiles.length,syntaxFailures:syntaxFailures.length,internalPhpAst,phpAstUsage,sourceCoverage},coverage:{expectedCategories:expected,sourceAstsPresent:sourceAstProps,sourceAstsMissing:missingCategories,sourceAstsUnexpected:extraCategories,completenessMissing},ast:{declarations:astDecls,construction,returnTypeMismatches,delegateMismatches},semanticLoss:fieldLoss,semanticFlow:{edges:semanticFlow,byNode:semanticFlowByNode,dimensions:dimensionEvidence},rescans:{allProjectRootScannerCalls:projectRootScannerCalls,hiddenRescans,pipelineRescans,scannerCallGraph,semanticReopenEdges},manifest:{producerBoundary:manifestProof,references:manifestRefs},highLevel:{semanticNodes:highLevelRefs},vocabulary:{nullabilityFiles},freeData,findings,summary:{critical,high,unproven,hiddenRescans:hiddenRescans.length,pipelineRescans:pipelineRescans.length,nestedProjectRootRescans:findings.filter(x=>x.kind==='nested_project_root_rescan').length,semanticFieldLoss:findings.filter(x=>x.kind==='semantic_field_loss_risk').length,semanticFieldMappingUnproven:findings.filter(x=>x.kind==='semantic_field_mapping_unproven').length,semanticLineageUnproven:findings.filter(x=>x.kind==='semantic_lineage_unproven').length,returnTypeMismatches:returnTypeMismatches.length,delegateMismatches:delegateMismatches.length,scannerGraphEdges:scannerCallGraph.length,semanticReopenEdges:semanticReopenEdges.length,freeData:freeData.length},repairOrder:['1. Establish/verify repository PHP AST producer and its consumption from ecommerce-shop source.','2. Complete SourceAsts + completeness vocabulary, including channels.','3. Remove every non-origin projectRoot rescan and hidden double scan.','4. Prove actual return types and exact delegate behavior of *Ast producers; reject legacy descriptor widening.',
    '4a. Remove canonical methods that delegate to legacy scanners; connect their existing canonical builders directly.',
    '5. Connect existing high-level semantic nodes at the origin boundary.','6. Repair semantic field loss at the first proven loss location in the existing upstream model/AST boundary.','7. Prove canonical AST constructors and provenance.','8. Prove SourceAsts -> CompleteSourceAst -> RouteSyncManifest.','9. Remove semantic fallback/Record only after upstream meaning is present.','10. Re-run on fresh ecommerce-shop source; legacy manifest remains rejected.']};
const out=abs('data-loss-trace-v31.json');fs.writeFileSync(out,JSON.stringify(report,null,2));
console.log(JSON.stringify({out:rel(out),status,phpFiles:phpFiles.length,internalPhpAst,critical,high,unproven,missingCategories,hiddenRescans:hiddenRescans.length,pipelineRescans:pipelineRescans.length,nestedProjectRootRescans:findings.filter(x=>x.kind==='nested_project_root_rescan').length,semanticFieldLoss:findings.filter(x=>x.kind==='semantic_field_loss_risk').length,semanticFieldMappingUnproven:findings.filter(x=>x.kind==='semantic_field_mapping_unproven').length,semanticLineageUnproven:findings.filter(x=>x.kind==='semantic_lineage_unproven').length,returnTypeMismatches:returnTypeMismatches.length,delegateMismatches:delegateMismatches.length,scannerGraphEdges:scannerCallGraph.length,semanticReopenEdges:semanticReopenEdges.length,freeData:freeData.length},null,2));
