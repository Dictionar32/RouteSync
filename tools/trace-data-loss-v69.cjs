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
const canonicalSourceAstProps=sourceAstProps.filter(x=>x!=='kind');
const missingCategories=expected.filter(x=>!canonicalSourceAstProps.includes(x));
const extraCategories=canonicalSourceAstProps.filter(x=>!expected.includes(x));
if(missingCategories.length){
  const canonicalMissing=missingCategories.filter(x=>x!=='channels');
  const extensionMissing=missingCategories.filter(x=>x==='channels');
  if(canonicalMissing.length)add(findings,'critical','source_asts_category_gap',{missing:canonicalMissing,present:canonicalSourceAstProps},'Complete the existing SourceAsts vocabulary before downstream interpretation.');
  if(extensionMissing.length)add(findings,'high','source_asts_extension_gap',{missing:extensionMissing,present:canonicalSourceAstProps},'Channel scanning exists outside SourceAsts; prove whether channels belong to the canonical upstream boundary before changing SourceAsts.');
}
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
            add(findings, item.file.includes('RouteScanner.ts') ? 'high' : 'critical','canonical_method_delegates_legacy_scan',item,'Canonical AST methods must not invoke their legacy scanner; interpret the source once and build the canonical ADT directly.');
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
  const normalizeLegacy = value => String(value||'').replace(/^await\s+/, '').trim();
  if(!uniqueDelegateMismatches.some(x=>x.file===item.file&&x.method===item.method&&normalizeLegacy(x.legacyExpression)===normalizeLegacy(item.legacyExpression)))uniqueDelegateMismatches.push(item);
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
  if(!provenConnection)add(findings,'high','semantic_lineage_unproven',{node,producerCount:producers.length,consumerCount:consumers.length},'Prove an actual producer and consumer for the existing high-level semantic node before claiming field preservation.');
  if(missing.length){
    if(provenConnection)add(findings,'high','semantic_field_loss_risk',item,'Carry the missing semantic facts through the existing canonical AST at the first proven loss location.');
    else add(findings,'high','semantic_field_mapping_unproven',{node,missing,semanticFields,canonicalFields},'Treat these as candidate gaps only; first connect the existing semantic node, then confirm whether each fact is actually lost.');
  }
}

// G. Prove the high-level model is connected by actual construction/consumption, not a text reference.
const highLevelRefs=Object.keys(mappings).map(node=>{
  const producers=hasSemanticProducer(node);
  const consumers=semanticConsumption(node);
  return {type:node,producerCount:producers.length,consumerCount:consumers.length,producers:producers.slice(0,10),consumers:consumers.slice(0,10),referenced:producers.length>0&&consumers.length>0};
});
for(const item of highLevelRefs)if(!item.referenced)add(findings,'high','high_level_model_unconnected',item,'Connect the existing high-level model at the origin boundary without creating a parallel interface.');

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
for(const f of tsFiles){
  const r=rel(f); if(!/types\/upstream|compiler\/scanner|compiler\/passes/.test(r))continue;
  const lines=read(r).split('\n');
  lines.forEach((s,i)=>{
    const trimmed=s.trim();
    if(/\bRecord\s*</.test(s)){
      const semantic=/semantic|operation|route|resource|model|response|request|expression|field|schema|contract/i.test(s);
      freeData.push({kind:'record',file:r,line:i+1,evidence:trimmed,semanticSignal:semantic,confidence:semantic?'MEDIUM':'LOW'});
    }
    if(/semanticType|primKind|responseType|resourceType|modelType|requestType|schemaType|cardinality|presence|nullability/.test(s)&&/\?\?/.test(s)&&!/\?\?\s*undefined\b/.test(s)){
      freeData.push({kind:'semantic_fallback',file:r,line:i+1,evidence:trimmed,semanticSignal:true,confidence:'HIGH'});
    }
    if(/\[key:\s*(?:string|number|symbol)\s*\]/.test(s)){
      const semantic=/semantic|operation|route|resource|model|response|request|expression|field|schema|contract/i.test(s);
      freeData.push({kind:'index_signature',file:r,line:i+1,evidence:trimmed,semanticSignal:semantic,confidence:semantic?'MEDIUM':'LOW'});
    }
  });
}
if(freeData.length)add(findings,'high','free_semantic_data',freeData,'Classify free containers and fallbacks. Semantic free data must trace to an existing ADT/model owner; structural containers are non-blocking evidence.');


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


// K. Model hierarchy / elevation proof.
// The highest existing upstream model is CompleteLaravelSourceModel. The auditor must prove
// whether it is actually an origin-boundary model or merely an unused type declaration.
const highModelPath='packages/core/src/types/upstream/highLevelSourceModel.ts';
const highModelText=read(highModelPath);
const highModelNames=['SourceProjectIdentity','SourceModelCatalog','SourceModelReferenceIndex','CompleteLaravelSourceModel'];
const highModelDecls={};
if(exists(highModelPath)){
  const sf=program.getSourceFile(abs(highModelPath))||parse(abs(highModelPath));
  for(const name of highModelNames){
    function visit(n){
      if((ts.isTypeAliasDeclaration(n)||ts.isInterfaceDeclaration(n))&&n.name.text===name)highModelDecls[name]={line:line(sf,n),type:n};
      ts.forEachChild(n,visit);
    }
    visit(sf);
  }
}
const highModelUsages=[];
for(const f of allCoreFiles){
  const sf=program.getSourceFile(f); if(!sf)continue;
  function visit(n){
    if(ts.isTypeReferenceNode(n)&&highModelNames.includes(n.typeName.getText(sf)) && rel(f)!==highModelPath){
      highModelUsages.push({file:rel(f),line:line(sf,n),type:n.typeName.getText(sf)});
    }
    ts.forEachChild(n,visit);
  }
  visit(sf);
}
if(!highModelUsages.length)add(findings,'high','highest_model_unconsumed',{model:'CompleteLaravelSourceModel',file:highModelPath},'Use the existing highest upstream model as the semantic origin boundary, or explicitly mark the model as design-only; do not leave a disconnected semantic vocabulary.');

const highModelDataflowEvidence=[];
for(const f of allCoreFiles){
  const sf=program.getSourceFile(f); if(!sf)continue;
  function visitHigh(n){
    if(ts.isVariableDeclaration(n)&&n.initializer){
      const t=checker.getTypeAtLocation(n.name);
      const tn=checker.typeToString(t,n.name,ts.TypeFormatFlags.NoTruncation);
      if(highModelNames.some(name=>tn===name||tn.endsWith('.'+name))){
        highModelDataflowEvidence.push({file:rel(f),line:line(sf,n),kind:'VALUE_DECLARATION',symbol:n.name.getText(sf),type:tn,expression:n.initializer.getText(sf).slice(0,500)});
      }
    }
    if(ts.isReturnStatement(n)&&n.expression){
      const t=checker.getTypeAtLocation(n.expression);
      const tn=checker.typeToString(t,n.expression,ts.TypeFormatFlags.NoTruncation);
      if(highModelNames.some(name=>tn===name||tn.endsWith('.'+name))){
        highModelDataflowEvidence.push({file:rel(f),line:line(sf,n),kind:'VALUE_RETURN',type:tn,expression:n.expression.getText(sf).slice(0,500)});
      }
    }
    if(ts.isPropertyAssignment(n)&&n.name.getText(sf)==='facts'){
      const vt=checker.typeToString(checker.getTypeAtLocation(n.initializer),n.initializer,ts.TypeFormatFlags.NoTruncation);
      const ct=checker.getContextualType(n.parent);
      const cn=ct?checker.typeToString(ct,n.parent,ts.TypeFormatFlags.NoTruncation):'';
      if(/ModelFacts|ModelSemanticNode|CompleteLaravelSourceModel/.test(vt+' '+cn)){
        highModelDataflowEvidence.push({file:rel(f),line:line(sf,n),kind:'FACTS_ASSIGNMENT',valueType:vt,contextualType:cn,expression:n.initializer.getText(sf).slice(0,500)});
      }
    }
    if(ts.isCallExpression(n)){
      const sig=checker.getResolvedSignature(n);
      if(sig){
        const params=sig.getParameters();
        n.arguments.forEach((arg,i)=>{
          const pd=params[i]?.valueDeclaration||params[i]?.declarations?.[0];
          if(!pd)return;
          const pt=checker.typeToString(checker.getTypeAtLocation(pd),pd,ts.TypeFormatFlags.NoTruncation);
          const at=checker.typeToString(checker.getTypeAtLocation(arg),arg,ts.TypeFormatFlags.NoTruncation);
          if(highModelNames.some(name=>pt===name||pt.endsWith('.'+name))||highModelNames.some(name=>at===name||at.endsWith('.'+name))){
            highModelDataflowEvidence.push({file:rel(f),line:line(sf,n),kind:'VALUE_CALL',parameterType:pt,argumentType:at,expression:n.getText(sf).slice(0,500)});
          }
        });
      }
    }
    ts.forEachChild(n,visitHigh);
  }
  visitHigh(sf);
}
const strongHighModelEvidence=highModelDataflowEvidence.filter(x=>x.kind!=='TYPE_REFERENCE');
if(highModelUsages.length&&!strongHighModelEvidence.length)add(findings,'critical','high_level_type_reference_without_dataflow',{model:'CompleteLaravelSourceModel',typeReferences:highModelUsages.slice(0,30)},'A type reference is not a producer. Require value-level evidence connecting existing semantic data into the high-level model.');

const highCatalogExpected=['models','resources','requests','responses','routes'];
let highCatalogFields=[];
if(highModelDecls.SourceModelCatalog){
  highCatalogFields=literalFields(highModelDecls.SourceModelCatalog.type.type,highModelDecls.SourceModelCatalog.type.getSourceFile()).map(x=>x.name);
}
const highCatalogMissing=highCatalogExpected.filter(x=>!highCatalogFields.includes(x));
const sourceAstsWithoutHighModel=expected.filter(x=>!highCatalogFields.includes(x));
if(highCatalogMissing.length)add(findings,'critical','highest_model_catalog_gap',{missing:highCatalogMissing,present:highCatalogFields},'Complete the existing high-level catalog vocabulary before claiming semantic completeness.');

// The highest model must also expose every canonical SourceAsts family or explicitly declare
// that the family is infrastructure-only. Silent omission is a dataflow gap.
const highModelCoverageGap=expected.filter(x=>!highCatalogFields.includes(x));
if(highModelCoverageGap.length)add(findings,'high','highest_model_source_category_gap',{missing:highModelCoverageGap},'Trace each SourceAsts category to the existing highest model or record an explicit non-semantic category boundary.');

// Detect direct SourceAsts construction from scanners while the highest model is disconnected.
const directSourceAstsConstruction=[];
for(const f of scannerFiles){
  const sf=program.getSourceFile(f); if(!sf)continue;
  function visit(n){
    if(ts.isObjectLiteralExpression(n)){
      const kind=n.properties.find(p=>ts.isPropertyAssignment(p)&&p.name.getText(sf)==='kind');
      if(kind&&kind.initializer.getText(sf).replace(/['"]/g,'')==='source_asts')directSourceAstsConstruction.push({file:rel(f),line:line(sf,n),kind:'source_asts'});
    }
    ts.forEachChild(n,visit);
  }
  visit(sf);
}
if(directSourceAstsConstruction.length&&!highModelUsages.length)add(findings,'high','origin_boundary_bypasses_highest_model',{directSourceAstsConstruction,highestModel:'CompleteLaravelSourceModel'},'Do not jump from scanner interpretations directly to SourceAsts while the existing high-level model is disconnected; establish the semantic origin boundary first.');

// Semantic duplication audit: Facts -> Definition already carries the same high-level dimensions.
// This is not automatically an error, but the auditor records it so future repairs do not create
// another parallel interface for the same semantic facts.
const semanticDuplication=[];
for(const item of fieldLoss){
  const exact=item.semanticFields.filter(f=>item.canonicalFields.includes(f));
  semanticDuplication.push({node:item.node,exactFieldCount:exact.length,semanticFieldCount:item.semanticFields.length,canonicalFieldCount:item.canonicalFields.length});
}

// K. Legacy evidence rejection.
const legacyRefs=[];for(const f of tsFiles){if(/routesync\.manifest\.json/.test(read(rel(f))))legacyRefs.push(rel(f));}
if(legacyRefs.length)add(findings,'critical','legacy_manifest_reference',legacyRefs,'Legacy manifest cannot prove fresh scanner lineage.');

// K2. Evidence confidence. A finding must state whether it is PROVEN, CANDIDATE, or UNPROVEN.
for(const f of findings){
  if(f.kind==='semantic_field_mapping_unproven'||f.kind==='semantic_lineage_unproven'||f.kind==='high_level_model_unconnected'||f.kind==='model_high_level_connection_missing'||f.kind==='adt_construction_unproven'||f.kind==='manifest_lineage_gap')f.evidence='UNPROVEN';
  else if(f.kind==='semantic_field_loss_risk'||f.kind==='canonical_method_delegates_legacy_scan'||f.kind==='ast_return_type_mismatch'||f.kind==='nested_project_root_rescan'||f.kind==='pipeline_rescan_after_ast'||f.kind==='hidden_rescan_after_ast'||f.kind==='scanner_graph_reopens_source')f.evidence='PROVEN';
  else f.evidence='PROVEN';
}

// L0. Semantic elevation matrix.
// The important question is not merely whether types exist, but whether every semantic
// dimension has a provable path through the existing models. This matrix is deliberately
// structural and fail-closed: an absent field is different from an unconnected field.
const elevationStages=['laravel_source','php_ast_adt','high_level_model','canonical_source_ast','complete_source_ast','manifest'];
const elevationMatrix=[];
const canonicalByNode={ModelSemanticNode:'ModelAst',ResourceSemanticNode:'ResourceAst',RequestSemanticNode:'RequestAst',ResponseSemanticNode:'ResponseAst',RouteSemanticNode:'RouteAst'};
const sourceRoots={models:'app/Models',resources:'app/Http/Resources',requests:'app/Http/Requests',responses:'app/Http/Responses',routes:'routes'};
const highModelTypeFields={};
for(const [name,decl] of Object.entries(highModelDecls)){
  if(!decl) continue;
  const t=decl.type.type||decl.type;
  highModelTypeFields[name]=literalFields(t,decl.type.getSourceFile()).map(x=>x.name);
}
function propertyShape(typeNode, ownerSf){
  if(!typeNode)return [];
  return literalFields(typeNode,ownerSf).map(x=>({name:x.name,type:x.type}));
}
function highSemanticNodeType(node){
  const catalogDecl=highModelDecls.SourceModelCatalog;
  if(!catalogDecl)return null;
  const catalogType=checker.getTypeAtLocation(catalogDecl.type.type||catalogDecl.type);
  const propertyName={ModelSemanticNode:'models',ResourceSemanticNode:'resources',RequestSemanticNode:'requests',ResponseSemanticNode:'responses',RouteSemanticNode:'routes'}[node];
  if(!propertyName)return null;
  const symbol=catalogType.getProperty(propertyName);
  if(!symbol)return null;
  const valueType=checker.getTypeOfSymbolAtLocation(symbol,catalogDecl.type);
  const checkerArgs=checker.getTypeArguments?.(valueType) || []; const args=checkerArgs.length?checkerArgs:(valueType.typeArguments||valueType.aliasTypeArguments||[]);
  return args.length===1 ? args[0] : null;
}
for(const [node,cfg] of Object.entries(mappings)){
  const highNodeType=highSemanticNodeType(node);
  const factsInfo=typeInfoByName(cfg.facts,abs('packages/core/src/types/upstream/'+cfg.factsFile));
  const astInfo=astMap.get(cfg.ast);
  const factsType=factsInfo?checker.getTypeAtLocation(ts.isTypeAliasDeclaration(factsInfo.node)?factsInfo.node.type:factsInfo.node):null;
  const astType=astInfo?checker.getTypeAtLocation(astInfo.node.type):null;
  const factsFields=factsType?typePropertyTree(factsType,checker):[];
  const astFields=astType?typePropertyTree(astType,checker):[];
  const highFields=highNodeType?typePropertyTree(highNodeType,checker):[];
  const astSet=new Set(astFields.map(x=>x.split('.').pop()));
  const highSet=new Set(highFields.map(x=>x.split('.').pop()));
  const semanticSet=new Set(factsFields.map(x=>x.split('.').pop()));
  const dimensions=[...new Set([...factsFields,...highFields,...astFields].map(x=>x.split('.').pop()))];
  const fields=dimensions.map(field=>{
    const semantic=semanticSet.has(field), high=highSet.has(field), ast=astSet.has(field);
    let state='UNPROVEN';
    if(semantic && high && ast) state='PRESENT_THROUGH_DECLARATIONS';
    else if(semantic && !high) state='HIGH_MODEL_ABSENT';
    else if(semantic && high && !ast) state='AST_ABSENT';
    return {field,semantic,high,ast,state};
  });
  const sourceDir=sourceRoots[node.replace('SemanticNode','s').toLowerCase()]||null;
  const producerCount=hasSemanticProducer(node).length;
  const fieldStateCounts=fields.reduce((a,x)=>(a[x.state]=(a[x.state]||0)+1,a),{});
  const row={node,canonicalAst:canonicalByNode[node],facts:cfg.facts,sourceDir,producerCount,fieldStateCounts,fields};
  elevationMatrix.push(row);
  if(fieldStateCounts.HIGH_MODEL_ABSENT)add(findings,'high','elevation_field_missing_high_model',{node,fields:fields.filter(x=>x.state==='HIGH_MODEL_ABSENT').map(x=>x.field)},'Carry existing semantic facts into the existing high-level model before lowering to canonical AST; do not create a parallel interface.');
  if(fieldStateCounts.AST_ABSENT)add(findings,'high','elevation_field_missing_ast',{node,fields:fields.filter(x=>x.state==='AST_ABSENT').map(x=>x.field)},'Preserve the existing high-level semantic facts in the canonical AST at the first proven model boundary.');
  if(producerCount===0)add(findings,'high','elevation_producer_unproven',{node,canonicalAst:canonicalByNode[node]},'Prove the actual producer that elevates source-derived facts into the existing high-level semantic node.');
}

// L1. Semantic transform consistency. When the same semantic field exists at two stages,
// compare the resolved types. A name match with a changed type is a transformation boundary,
// not preservation. This catches silent narrowing/widening that name-only analysis misses.
const semanticTypeTransforms=[];
for(const row of elevationMatrix){
  const cfg=mappings[row.node];
  const factsInfo=typeInfoByName(cfg.facts,abs('packages/core/src/types/upstream/'+cfg.factsFile));
  const astInfo=astMap.get(cfg.canonicalAst);
  if(!factsInfo||!astInfo)continue;
  const factsType=checker.getTypeAtLocation(ts.isTypeAliasDeclaration(factsInfo.node)?factsInfo.node.type:factsInfo.node);
  const astType=checker.getTypeAtLocation(astInfo.node.type);
  const factsProps=typePropertyTree(factsType,checker);
  const astProps=typePropertyTree(astType,checker);
  const factMap=new Map(factsProps.map(x=>[x.split('.').pop(),x]));
  const astMapByName=new Map(astProps.map(x=>[x.split('.').pop(),x]));
  for(const field of [...factMap.keys()]){
    if(!astMapByName.has(field))continue;
    const fp=factMap.get(field), ap=astMapByName.get(field);
    const ft=propertyTypeByPath(factsType,fp,checker), at=propertyTypeByPath(astType,ap,checker);
    const from=ft?checker.typeToString(ft):null, to=at?checker.typeToString(at):null;
    if(from&&to&&from!==to){
      const item={node:row.node,field,from,to,factsPath:fp,astPath:ap};
      semanticTypeTransforms.push(item);
      add(findings,'critical','semantic_type_transform_unproven',item,'Prove the intentional semantic transformation; otherwise preserve the source meaning instead of silently changing its type.');
    }
  }
}

// L2. Boundary monotonicity. Once a semantic fact exists upstream, downstream models should
// not introduce a second source of truth for the same dimension. Detect duplicate semantic
// producers by looking for multiple construction sites of the same canonical kind/fact pair.
const semanticProducerSites=[];
for(const [node,cfg] of Object.entries(mappings)){
  const targetKind=cfg.ast.replace('Ast','').replace(/([a-z])([A-Z])/g,'$1_$2').toLowerCase()+'_ast';
  for(const f of scannerFiles){
    const sf=program.getSourceFile(f); if(!sf)continue;
    function visit(n){
      if(ts.isObjectLiteralExpression(n)){
        const kind=n.properties.find(p=>ts.isPropertyAssignment(p)&&p.name.getText(sf)==='kind');
        if(kind&&kind.initializer.getText(sf).replace(/["']/g,'')===targetKind){
          const props=n.properties.map(p=>p.name&&p.name.getText(sf)).filter(Boolean);
          semanticProducerSites.push({node,ast:cfg.ast,file:rel(f),line:line(sf,n),properties:props});
        }
      }
      ts.forEachChild(n,visit);
    }
    visit(sf);
  }
}
for(const node of Object.keys(mappings)){
  const sites=semanticProducerSites.filter(x=>x.node===node);
  const unique=[...new Set(sites.map(x=>x.file+':'+x.line))];
  if(unique.length>1)add(findings,'high','multiple_semantic_producers',{node,sites:sites.slice(0,20)},'Reduce semantic construction to one authoritative producer or prove the producers are disjoint ADT variants.');
}

// M. Interface repair guidance.
// This layer converts trace evidence into actionable guidance without inventing a new
// interface. It resolves the existing semantic owner, existing facts producer, canonical
// AST declaration/producer, and the Laravel source-family evidence. A repair is actionable
// only when the required evidence exists; otherwise it is explicitly BLOCKED/UNPROVEN.
function declarationLocation(typeName, fileHint){
  const candidates=fileHint?[abs(fileHint)]:allCoreFiles;
  for(const f of candidates){
    if(!exists(f))continue;
    const sf=program.getSourceFile(f)||parse(f);
    let found=null;
    function visit(n){
      if(found)return;
      if((ts.isTypeAliasDeclaration(n)||ts.isInterfaceDeclaration(n))&&n.name.text===typeName)
        found={file:rel(f),line:line(sf,n),symbol:typeName};
      ts.forEachChild(n,visit);
    }
    visit(sf);
    if(found)return found;
  }
  return null;
}
function factProducerEvidence(factsName){
  const hits=[];
  for(const f of allCoreFiles){
    const sf=program.getSourceFile(f); if(!sf)continue;
    function visit(n){
      if(ts.isVariableDeclaration(n)&&n.type&&n.type.getText(sf)===factsName&&n.initializer)
        hits.push({file:rel(f),line:line(sf,n),symbol:n.name.getText(sf),kind:'typed_assignment'});
      if(ts.isAsExpression(n)&&n.type.getText(sf)===factsName)
        hits.push({file:rel(f),line:line(sf,n),symbol:'as_expression',kind:'cast'});
      if(ts.isTypeReferenceNode(n)&&n.typeName.getText(sf)===factsName){
        const parent=n.parent;
        if(ts.isVariableDeclaration(parent)&&parent.type===n) {
          // handled above; avoid duplicate evidence.
        }
      }
      ts.forEachChild(n,visit);
    }
    visit(sf);
  }
  return hits;
}
function semanticNodeDeclaration(node){
  return declarationLocation(node,highModelPath);
}
function catalogOwner(node){
  const prop={ModelSemanticNode:'models',ResourceSemanticNode:'resources',RequestSemanticNode:'requests',ResponseSemanticNode:'responses',RouteSemanticNode:'routes'}[node];
  if(!prop)return null;
  const decl=highModelDecls.SourceModelCatalog;
  return decl?{file:highModelPath,line:line(decl.type.getSourceFile(),decl.type),field:prop}:null;
}
function canonicalDeclaration(node){
  const astName=canonicalByNode[node];
  return astName?declarationLocation(astName,astPath):null;
}
function canonicalProducerEvidence(node){
  const astName=canonicalByNode[node];
  const targetKind=astName.replace('Ast','').replace(/([a-z])([A-Z])/g,'$1_$2').toLowerCase()+'_ast';
  const hits=[];
  for(const f of scannerFiles){
    const sf=program.getSourceFile(f); if(!sf)continue;
    function visit(n){
      if(ts.isObjectLiteralExpression(n)){
        const k=n.properties.find(p=>ts.isPropertyAssignment(p)&&p.name.getText(sf)==='kind');
        if(k&&k.initializer.getText(sf).replace(/["']/g,'')===targetKind)
          hits.push({file:rel(f),line:line(sf,n),kind:targetKind});
      }
      ts.forEachChild(n,visit);
    }
    visit(sf);
  }
  return hits;
}
const interfaceRepairGuidance=[];
for(const [node,cfg] of Object.entries(mappings)){
  const factsDecl=declarationLocation(cfg.facts,`packages/core/src/types/upstream/${cfg.factsFile}`);
  const semanticDecl=semanticNodeDeclaration(node);
  const catalog=catalogOwner(node);
  const canonical=canonicalDeclaration(node);
  const factsProducers=factProducerEvidence(cfg.facts);
  const canonicalProducers=canonicalProducerEvidence(node);
  const lineage=semanticFlowByNode[node]||[];
  const highRef=highLevelRefs.find(x=>x.type===node);
  const row=elevationMatrix.find(x=>x.node===node);
  const highNodeType=highSemanticNodeType(node);
  const highDirectFields=highNodeType?highNodeType.getProperties().map(p=>p.name):[];
  const semanticContainerField=highDirectFields.includes('facts')?'facts':null;
  const missingHigh=row?row.fields.filter(x=>x.state==='HIGH_MODEL_ABSENT').map(x=>x.field):[];
  const directMissingHigh=missingHigh.filter(field=>!semanticContainerField);
  const missingAst=row?row.fields.filter(x=>x.state==='AST_ABSENT').map(x=>x.field):[];
  const candidateSourceFiles=sourceCoverage
    .filter(x=>sourceRoots[node.replace('SemanticNode','s').toLowerCase()]===x.sourceDir)
    .flatMap(x=>x.phpFiles?phpFiles.filter(f=>rel(f).includes(x.sourceDir)).map(rel):[])
    .slice(0,20);
  let action='BLOCKED_UNPROVEN';
  let reason=[];
  if(!highRef?.producerCount){
    action='CONNECT_EXISTING_HIGH_LEVEL_MODEL';
    reason.push('No actual producer for the existing semantic node is proven.');
  }
  if(factsProducers.length===0){
    reason.push(`No runtime producer for ${cfg.facts} is proven.`);
  }
  if(canonicalProducers.length===0){
    reason.push(`No canonical ${cfg.ast} producer is proven.`);
  }
  if(highRef?.producerCount&&factsProducers.length&&canonicalProducers.length){
    if(directMissingHigh.length)action='ENRICH_EXISTING_HIGH_LEVEL_INTERFACE';
    else if(missingAst.length)action='PRESERVE_EXISTING_FACTS_IN_CANONICAL_AST';
    else action='VERIFY_FIELD_BY_FIELD_LINEAGE';
  }
  if(!candidateSourceFiles.length)reason.push('No Laravel source-family file evidence resolved.');
  const changeTargets=[];
  if(action==='CONNECT_EXISTING_HIGH_LEVEL_MODEL'||action==='ENRICH_EXISTING_HIGH_LEVEL_INTERFACE'){
    changeTargets.push({file:highModelPath,line:semanticDecl?.line||null,symbol:node,change:'existing_interface_only',fields:directMissingHigh,why:'Existing semantic owner is the high-level model; do not create a parallel interface.'});
    if(catalog)changeTargets.push({file:catalog.file,line:catalog.line,symbol:'SourceModelCatalog',field:catalog.field,change:'wire_existing_node',why:'The node must enter the existing high-level catalog before canonical lowering.'});
  }
  if(action==='PRESERVE_EXISTING_FACTS_IN_CANONICAL_AST'){
    changeTargets.push({file:canonical?.file||astPath,line:canonical?.line||null,symbol:cfg.ast,change:'preserve_existing_semantic_data',fields:missingAst,why:'A semantic fact already exists upstream; downstream must not reconstruct it.'});
  }
  interfaceRepairGuidance.push({
    node,
    owner:{semanticNode:semanticDecl,catalogOwner:catalog,facts:factsDecl,canonicalAst:canonical},
    evidence:{factsProducers:factsProducers.slice(0,20),semanticNodeProducers:highRef?.producers||[],canonicalAstProducers:canonicalProducers.slice(0,20),semanticFlow:lineage.slice(0,30),laravelSourceFiles:candidateSourceFiles},
    gap:{missingHighModel:missingHigh,directMissingHigh,semanticContainerField,missingCanonicalAst:missingAst},
    action,
    changeTargets,
    reason,
    confidence:action==='BLOCKED_UNPROVEN'?'UNPROVEN':action==='VERIFY_FIELD_BY_FIELD_LINEAGE'?'CANDIDATE':'CANDIDATE'
  });
}
// Build explicit datum-level guidance from the actual ModelFacts producer. This is the first
// source-backed example; other categories stay fail-closed until their facts producers exist.
const sourceBackedDatumGuidance=[];
for(const item of interfaceRepairGuidance){
  if(item.node!=='ModelSemanticNode')continue;
  const producer=item.evidence.factsProducers[0];
  if(!producer)continue;
  const factsItem=fieldLoss.find(x=>x.node==='ModelSemanticNode');
  const semanticFields=factsItem?factsItem.semanticFields:[];
  for(const field of semanticFields){
    sourceBackedDatumGuidance.push({
      node:item.node,
      datum:field,
      sourceBoundary:{project:'examples/ecommerce-shop-source',category:'models',status:'SOURCE_FAMILY_PROVEN'},
      currentOwner:{interface:'ModelFacts',file:item.owner.facts?.file||null,line:item.owner.facts?.line||null},
      existingHighLevelOwner:{interface:'ModelSemanticNode',file:item.owner.semanticNode?.file||null,line:item.owner.semanticNode?.line||null},
      canonicalOwner:{interface:'ModelAst',file:item.owner.canonicalAst?.file||null,line:item.owner.canonicalAst?.line||null},
      producer:{file:producer.file,line:producer.line,symbol:producer.symbol},
      instruction:'Preserve this datum through the existing upstream model chain; do not derive it again downstream.',
      status:item.evidence.semanticNodeProducers.length?'TRACEABLE':'BLOCKED_BEFORE_HIGH_LEVEL_MODEL'
    });
  }
}


// M. Source-backed interface repair map. Resolve semantic datum ownership from the
// existing ModelFacts -> ModelAst producer and correlate it with actual Laravel model
// source files. This is intentionally evidence-only: no synthetic interface is proposed.
function findLaravelModelEvidence(){
  const files=[];
  for(const f of phpFiles){
    let text;
    try { text=fs.readFileSync(f,'utf8'); } catch { continue; }
    if(/extends\s+(?:Authenticatable|Model|Pivot)|use\s+Illuminate\\Database\\Eloquent\\Model/.test(text)){
      files.push({file:rel(f),lines:text.split(/\r?\n/).length,
        signals:{primaryKey:/\$primaryKey\s*=/.test(text),table:/\$table\s*=/.test(text),fillable:/\$fillable\s*=/.test(text),guarded:/\$guarded\s*=/.test(text),hidden:/\$hidden\s*=/.test(text),appends:/\$appends\s*=/.test(text),casts:/\$casts\s*=/.test(text),relations:/function\s+[A-Za-z_]\w*\s*\(/.test(text)}});
    }
  }
  return files;
}
const laravelModelEvidence=findLaravelModelEvidence();
const modelDatumLineage=[];
const modelFactsProducer=semanticProducerSites.filter(x=>x.node==='ModelSemanticNode')[0]||null;
const modelFactsSource = factProducerEvidence('ModelFacts');
const modelDatumPaths={
  identity:['model.semantic.identity','facts.identity'],
  key:['model.semantic.key','facts.key'],
  behavior:['model.semantic.behavior','facts.behavior'],
  exposure:['model.semantic.exposure','facts.exposure'],
  capabilities:['factsSource.traits','facts.capabilities'],
  surface:['surfaceMembers','facts.surface'],
  source:['span','facts.source']
};
for(const [datum,paths] of Object.entries(modelDatumPaths)){
  const sourceSignals=laravelModelEvidence.filter(x=>{
    if(datum==='key')return x.signals.primaryKey;
    if(datum==='exposure')return x.signals.fillable||x.signals.guarded||x.signals.hidden||x.signals.appends;
    if(datum==='behavior')return x.signals.casts||x.signals.relations;
    if(datum==='capabilities')return true;
    return true;
  });
  modelDatumLineage.push({
    datum,
    source:{files:sourceSignals.slice(0,20),status:sourceSignals.length?'SOURCE_EVIDENCE_FOUND':'SOURCE_EVIDENCE_NOT_FOUND'},
    extraction:{paths,producer:modelFactsSource.slice(0,10)},
    highLevel:{owner:'ModelSemanticNode.facts',declaration:semanticNodeDeclaration('ModelSemanticNode')},
    canonical:{owner:'ModelAst.facts',declaration:canonicalDeclaration('ModelSemanticNode'),producer:modelFactsProducer},
    decision:sourceSignals.length&&modelFactsSource.length?'TRACEABLE_TO_EXISTING_FACTS':'UNPROVEN',
    repair:sourceSignals.length&&modelFactsSource.length?'Preserve the datum through existing ModelFacts/ModelSemanticNode/ModelAst chain; do not add downstream fallback or parallel interface.':'Do not change interface from this evidence alone; prove the missing producer/source expression first.'
  });
}



// V36b. AST/ADT boundary audit.
// Having a repository PHP AST implementation is not enough: each semantic scanner must consume
// that ADT at its origin boundary. Token-only semantic extraction is a dataflow bypass because
// the richer AST meaning cannot reach the upstream model through that path.
const astBoundaryViolations=[];
const astConsumerPatterns=/classifyPhpBlock|classifyAstTokens|classifyAstValue|PhpAstFactory|matchPhpAstValue/;
for(const f of scannerFiles){
  const r=rel(f), text=read(r);
  const isSemanticScanner=/subscanners\/(model|resource|request|route|controller|response|service|migration|dto|middleware|provider|attribute)/.test(r);
  if(!isSemanticScanner)continue;
  const tokenOnly=/LaravelSourceLexer\.tokenize\(|tokenizePhpSource\(/.test(text) && !astConsumerPatterns.test(text);
  // Tokenization itself is not a bypass when the same boundary immediately constructs
  // an existing AST/ADT or delegates to an existing AST parser. Only semantic extraction
  // that keeps meaning in raw token windows is a bypass.
  const directAstProducer=/LaravelSourceLexer\.parse[A-Z][A-Za-z0-9_]*\(/.test(text)
    || /parseModelMembers\(source,\s*tokens/.test(text)
    || /return\s*\{[\s\S]{0,800}kind:\s*['"][a-z_]+_ast['"]/.test(text)
    || /Promise<[^>]*(?:Ast|AST)[^>]*>/.test(text)
    || /\)\s*:\s*(?:readonly\s+)?[A-Za-z0-9_]*(?:Ast|AST)\b/.test(text);
  if(tokenOnly && !directAstProducer){
    const category=(r.match(/subscanners\/([^/]+)/)||[])[1]||'unknown';
    const item={file:r,category,reason:'semantic scanner consumes token stream without consuming repository PHP AST/ADT'};
    astBoundaryViolations.push(item);
    add(findings,'critical','semantic_scanner_bypasses_php_ast',item,'Move semantic extraction to the existing PHP AST/ADT boundary; keep tokenization below the ADT producer and do not add another parser/interface layer.');
  }
}
// Detect ParsedModel-style mutable/free semantic descriptors that sit between source and the
// canonical upstream model. These are not automatically deletable; they are repair targets
// because they currently act as a second semantic vocabulary.
const intermediateDescriptorFindings=[];
for(const f of scannerFiles){
  const r=rel(f), text=read(r);
  if(/subscanners\/model\/(modelMemberParser|modelParser)\.ts$/.test(r) && /interface\s+ParsedModelMembers/.test(text)){
    const item={file:r,symbol:'ParsedModelMembers',reason:'intermediate semantic descriptor is populated directly from tokens before canonical ModelFacts'};
    intermediateDescriptorFindings.push(item);
    add(findings,'high','intermediate_semantic_descriptor_boundary',item,'Treat the existing descriptor as a migration boundary: trace each datum from PHP AST/ADT into the existing upstream facts owner; do not create a third vocabulary.');
  }
}

// V36. Concrete field-level producer lineage.
// The previous elevation matrix compared declaration shapes. That is not enough to guide
// an interface repair. V36 resolves actual object-literal producers and records the exact
// initializer expression for each semantic datum at the existing producer boundary.
function objectLiteralFieldEvidence(file, objectKind) {
  const sf=program.getSourceFile(file)||parse(file), hits=[];
  function visit(n){
    if(ts.isObjectLiteralExpression(n)){
      const kind=n.properties.find(p=>ts.isPropertyAssignment(p)&&p.name.getText(sf)==='kind');
      if(kind && kind.initializer.getText(sf).replace(/["']/g,'')===objectKind){
        for(const p of n.properties){
          if(ts.isPropertyAssignment(p)){
            hits.push({
              file:rel(file), line:line(sf,p), field:p.name.getText(sf).replace(/^['"]|['"]$/g,''),
              expression:p.initializer.getText(sf), expressionType:checker.typeToString(checker.getTypeAtLocation(p.initializer),p.initializer,ts.TypeFormatFlags.NoTruncation)
            });
          }
        }
      }
    }
    ts.forEachChild(n,visit);
  }
  visit(sf); return hits;
}
function fieldProducerLineage(typeName, objectKind, producerFile){
  const evidence=objectLiteralFieldEvidence(abs(producerFile),objectKind);
  const byField=new Map();
  for(const item of evidence){if(!byField.has(item.field))byField.set(item.field,[]);byField.get(item.field).push(item);}
  return [...byField.entries()].map(([field,sites])=>({field,producerSites:sites}));
}
const concreteFieldLineage=[];
const concreteProducerConfigs=[
  {node:'ModelSemanticNode',facts:'ModelFacts',kind:'model_facts',file:'packages/core/src/compiler/scanner/subscanners/model/modelCanonical.ts'},
  {node:'ModelAst',facts:'ModelDefinition',kind:'model',file:'packages/core/src/compiler/scanner/subscanners/model/modelCanonical.ts'}
];
for(const cfg of concreteProducerConfigs){
  const fields=fieldProducerLineage(cfg.facts,cfg.kind,cfg.file);
  concreteFieldLineage.push({node:cfg.node,sourceType:cfg.facts,producerFile:cfg.file,fields});
}
// Match every existing ModelFacts datum to an actual producer expression. Missing producer
// expressions are now explicit blockers for interface guidance.
const modelFactsConcrete=concreteFieldLineage.find(x=>x.sourceType==='ModelFacts');
const modelFactsFieldMap=new Map((modelFactsConcrete?.fields||[]).map(x=>[x.field,x]));
for(const datum of modelDatumLineage){
  const concrete=modelFactsFieldMap.get(datum.datum);
  datum.extraction = {...datum.extraction, concreteProducer:concrete||null};
  if(!concrete){
    datum.decision='UNPROVEN';
    datum.repair='Do not alter the interface from this datum. The existing ModelFacts producer does not expose a concrete field initializer that can be traced.';
  } else if(datum.source.files?.length && datum.extraction.producer?.length){
    datum.decision='SOURCE_TO_EXISTING_FACTS_PRODUCER_PROVEN';
    datum.repair='Preserve the existing datum through ModelFacts -> existing high-level owner -> canonical AST; no downstream fallback and no parallel interface.';
  }
}
// Interface guidance now distinguishes four states: CHANGE_INTERFACE, WIRE_INTERFACE,
// PRESERVE_DATUM, and BLOCKED. A declaration-only match can never authorize CHANGE_INTERFACE.
for(const item of interfaceRepairGuidance){
  const node=item.node;
  const concrete=(node==='ModelSemanticNode')?modelFactsConcrete:null;
  const hasConcrete=Boolean(concrete?.fields?.length);
  const highProducer=item.evidence.semanticNodeProducers?.length>0;
  const direct=item.gap.directMissingHigh||[];
  if(node==='ModelSemanticNode' && hasConcrete && highProducer && direct.length===0){
    item.action='PRESERVE_EXISTING_SEMANTIC_DATUM';
    item.confidence='PROVEN_FOR_EXISTING_FACTS_PRODUCER';
    item.changeTargets=[{file:item.owner.facts?.file||null,line:item.owner.facts?.line||null,symbol:'ModelFacts',change:'preserve_existing_fields',fields:concrete.fields.map(x=>x.field),why:'Concrete producer expressions are present; the interface already owns these facts.'}];
    item.reason.push('Concrete ModelFacts object-literal producer is proven; no new top-level interface field is justified by this evidence.');
  }
}
const interfaceChangeCandidates=[];
for(const row of elevationMatrix){
  const missing=(row.fields||[]).filter(x=>x.state==='HIGH_MODEL_ABSENT').map(x=>x.field);
  if(!missing.length)continue;
  const owner=interfaceRepairGuidance.find(x=>x.node===row.node);
  const factsProducer=(row.node==='ModelSemanticNode')?modelFactsConcrete:null;
  interfaceChangeCandidates.push({
    node:row.node, missingFields:missing,
    existingOwner:owner?.owner?.semanticNode||null,
    existingFactsOwner:owner?.owner?.facts||null,
    concreteProducerFields:factsProducer?.fields?.map(x=>x.field)||[],
    decision:owner?.evidence?.semanticNodeProducers?.length?'CANDIDATE_NEEDS_FIELD_LINEAGE':'BLOCKED_NO_SEMANTIC_PRODUCER',
    instruction:'Do not create a parallel interface. Only enrich the existing owner after a concrete source datum and producer expression are proven.'
  });
}


// V37. Source datum -> parser boundary -> existing semantic owner proof.
// This layer is intentionally fail-closed: a token-level extractor is evidence of a
// boundary violation, not proof that the datum originated from the repository PHP ADT.
const sourceDatumLineage=[];
const parserBoundaryGuidance=[];
const modelPropertyParser='packages/core/src/compiler/scanner/subscanners/model/memberPropertiesParser.ts';
const modelParserSource=read(modelPropertyParser);
const modelDatumRules=[
  {datum:'table',token:'$table',state:'state.table',sourceCategory:'models'},
  {datum:'primaryKey',token:'$primaryKey',state:'state.primaryKey',sourceCategory:'models'},
  {datum:'keyType',token:'$keyType',state:'state.keyType',sourceCategory:'models'},
  {datum:'incrementing',token:'$incrementing',state:'state.incrementing',sourceCategory:'models'},
  {datum:'fillable',token:'$fillable',state:'state.fillable',sourceCategory:'models'},
  {datum:'guarded',token:'$guarded',state:'state.guarded',sourceCategory:'models'},
  {datum:'hidden',token:'$hidden',state:'state.hidden',sourceCategory:'models'},
  {datum:'appends',token:'$appends',state:'state.appends',sourceCategory:'models'}
];
for(const rule of modelDatumRules){
  const idx=modelParserSource.indexOf(`token.value === '${rule.token}'`);
  if(idx<0) continue;
  const lineNo=(modelParserSource.slice(0,idx).match(/\n/g)||[]).length+1;
  const arrayPath=/parseArray\(/.test(modelParserSource.slice(idx,idx+500))?'LaravelSourceLexer.parseArray':'token_window';
  const evidence={
    datum:rule.datum,
    sourceCategory:rule.sourceCategory,
    parser:{file:modelPropertyParser,line:lineNo,symbol:'tryParseModelProperty'},
    sourceExpression:`${rule.token} = ...`,
    extractionBoundary:arrayPath,
    astOrigin:'UNPROVEN',
    currentPath:[
      'Laravel PHP source',
      'LaravelSourceLexer.tokenize(source)',
      'tryParseModelProperty(source,tokens,i,state)',
      rule.state,
      'ParsedModelMembers',
      'ParsedModel',
      'ModelFacts'
    ],
    missingProof:['PHP AST/ADT node corresponding to source datum','ADT consumer call before token-level extraction','field-preserving producer from AST/ADT into existing semantic owner']
  };
  sourceDatumLineage.push(evidence);
  parserBoundaryGuidance.push({
    datum:rule.datum,
    action:'REPAIR_EXISTING_PARSER_BOUNDARY',
    confidence:'PROVEN_TOKEN_BYPASS__AST_ORIGIN_UNPROVEN',
    target:{file:modelPropertyParser,line:lineNo,symbol:'tryParseModelProperty'},
    instruction:'Change the existing extraction boundary to consume the repository PHP AST/ADT datum, then populate the existing ParsedModelMembers/ModelFacts owner. Do not create another semantic interface.',
    forbiddenFixes:['downstream fallback','regex re-classification','new parallel interface','copying token parser into another scanner']
  });
}
const modelSourceFiles=walk(abs('examples/ecommerce-shop-source/app/Models')).filter(f=>/\.php$/.test(f));
for(const file of modelSourceFiles){
  const text=read(rel(file));
  const matched=modelDatumRules.filter(rule=>text.includes(rule.token));
  if(!matched.length)continue;
  sourceDatumLineage.push({
    sourceFile:rel(file),
    sourceKind:'laravel_model_php',
    datumEvidence:matched.map(x=>({datum:x.datum,sourceExpression:x.token})),
    astOrigin:'UNPROVEN',
    reason:'The source datum is present in ecommerce-shop, but the current producer reads the token stream instead of a repository PHP AST/ADT node.'
  });
}
if(sourceDatumLineage.some(x=>x.astOrigin==='UNPROVEN')){
  add(findings,'critical','source_datum_ast_origin_unproven',{
    parser:modelPropertyParser,
    datums:modelDatumRules.map(x=>x.datum),
    sourceFiles:modelSourceFiles.length
  },'Trace each existing semantic datum from the repository PHP AST/ADT node before the existing semantic owner; token presence is not AST lineage proof.');
}

// V37. Identify the exact existing interface owner that should receive repaired data.
// Ownership is resolved conservatively from already existing declarations; no new interface
// names are proposed by the analyzer.
const interfaceOwnershipGuidance=[];
const existingOwners=[
  {datum:'table',owner:'ModelFacts'},
  {datum:'primaryKey',owner:'ModelFacts'},
  {datum:'keyType',owner:'ModelFacts'},
  {datum:'incrementing',owner:'ModelFacts'},
  {datum:'fillable',owner:'ModelFacts'},
  {datum:'guarded',owner:'ModelFacts'},
  {datum:'hidden',owner:'ModelFacts'},
  {datum:'appends',owner:'ModelFacts'}
];
for(const item of parserBoundaryGuidance){
  const owner=existingOwners.find(x=>x.datum===item.datum);
  interfaceOwnershipGuidance.push({
    datum:item.datum,
    existingOwner:owner?.owner||null,
    change:item.action,
    sourceBoundary:item.target,
    decision:owner?'WIRE_EXISTING_OWNER':'BLOCKED_NO_OWNER',
    reason:owner?'The semantic owner already exists; repair the producer boundary before changing interface shape.':'No canonical owner was proven; do not invent one.'
  });
}

// V37. ADT-consumption contract: canonical semantic scanners must show an AST/ADT value entering
// their extraction function. Static call evidence is enough to classify a boundary as PROVEN or
// UNPROVEN, but never enough to fabricate a successful lineage.
const astConsumerContract=[];
for(const item of astBoundaryViolations){
  astConsumerContract.push({
    category:item.category,
    file:item.file,
    status:'BYPASS_PROVEN__AST_CONSUMPTION_MISSING',
    repair:'Refactor the existing semantic extraction function to accept the existing repository PHP AST/ADT value at the origin boundary.',
    interfaceRule:'Enrich an existing owner only after the AST/ADT datum is mapped into that owner.'
  });
}

// V40. First-loss boundary + datum-level dataflow.
// The tool must identify the first boundary where a source datum stops having a
// proven representation. A later semantic owner cannot repair an earlier missing ADT.
const firstLossBoundary=[];
const routeCanonicalBoundary = {
  parsedRouteProducer: /Promise<readonly ParsedRoute\[\]>/ .test(read('packages/core/src/compiler/scanner/subscanners/RouteScanner.ts')),
  astMethodDelegatesLegacy: /scanAsts[\s\S]*RouteScanner\.scan\(/.test(read('packages/core/src/compiler/scanner/subscanners/RouteScanner.ts')),
  routeAstDefinitionRequiresSpan: /readonly span: SourceSpan/.test(read('packages/core/src/types/upstream/route.ts')),
  parsedRouteHasSpan: /readonly (span|sourceSpan):/.test(read('packages/core/src/types/domain/routes.ts')),
  routeAstProducerExists: /kind:\s*['\"]route_ast['\"]/.test(read('packages/core/src/compiler/scanner/subscanners/RouteScanner.ts'))
};
if(routeCanonicalBoundary.astMethodDelegatesLegacy && routeCanonicalBoundary.parsedRouteProducer && !routeCanonicalBoundary.routeAstProducerExists){
  add(findings,'high','route_ast_producer_missing',{routeCanonicalBoundary},'RouteScanner.scanAsts must consume a source-backed route representation that preserves the RouteDefinition fields, including SourceSpan; do not cast ParsedRoute to RouteAst.');
}
if(routeCanonicalBoundary.routeAstDefinitionRequiresSpan && !routeCanonicalBoundary.parsedRouteHasSpan){
  add(findings,'high','route_source_span_lost_before_ast',{routeCanonicalBoundary},'The canonical RouteAst requires SourceSpan, but ParsedRoute does not expose one; preserve the existing declaration span at the existing route owner before constructing RouteAst.');
}
const routeDeclarationAstFile='packages/core/src/compiler/scanner/lexer/routeAst/routeDeclarationAst.ts';
const routeDeclarationParserFile='packages/core/src/compiler/scanner/lexer/routeAst/routeDeclarationParser.ts';
const routeDeclarationAstText=read(routeDeclarationAstFile);
const routeDeclarationParserText=read(routeDeclarationParserFile);
const routeOwnerEvidence={
  existingOwner:/interface RouteDeclarationAst/.test(routeDeclarationAstText),
  sourceToken:/readonly source:\s*TokenDescriptor/.test(routeDeclarationAstText),
  tokenHasSpan:/readonly startOffset: SourceOffset/.test(read('packages/core/src/compiler/scanner/lexer/phpAstCoreTypes.ts')) && /readonly endOffset: SourceOffset/.test(read('packages/core/src/compiler/scanner/lexer/phpAstCoreTypes.ts')),
  parserConstructsOwner:/Object\.freeze\(\{[\s\S]*source:\s*tokens\[i\]/.test(routeDeclarationParserText),
  declarationEndPreserved:/endOffset/.test(routeDeclarationAstText)
};

const modelDatumDataflow=[];
const modelPropertyAstParserFileEarly='packages/core/src/compiler/scanner/subscanners/model/modelPropertyAstParser.ts';
const modelPropertyAstParserTextEarly=read(modelPropertyAstParserFileEarly);
const modelPropertyAstProducerProofEarly={
  exists:fs.existsSync(abs(modelPropertyAstParserFileEarly)),
  produces:/parseModelPropertyAsts/.test(modelPropertyAstParserTextEarly) && /kind:\s*'class_property'/.test(modelPropertyAstParserTextEarly),
  valuePreserved:/value:\s*classifyAstTokens\(valueTokens\)/.test(modelPropertyAstParserTextEarly),
  namePreserved:/name:\s*createAstIdentifier/.test(modelPropertyAstParserTextEarly),
  sourceSpanPreserved:/startOffset|endOffset/.test(modelPropertyAstParserTextEarly),
  semanticConsumer:/applyModelPropertyAst/.test(read('packages/core/src/compiler/scanner/subscanners/model/modelMemberParser.ts'))
};
const modelPropertyAstBoundaryStatusEarly=Object.values(modelPropertyAstProducerProofEarly).every(v=>typeof v==='boolean'?v:true)
  ? 'AST_PRODUCER_AND_CONSUMER_PROVEN' : 'AST_PRODUCER_OR_CONSUMER_UNPROVEN';


const modelSourceDatumEvidence=[];

function sourceDatumEvidence(rule){
  const rows=[];
  for(const file of modelSourceFiles){
    const text=fs.readFileSync(file,'utf8');
    if(!text.includes(rule.token)) continue;
    const lines=text.split('\n');
    lines.forEach((line,i)=>{
      if(line.includes(rule.token) && line.includes('=')) rows.push({file:rel(file),line:i+1,evidence:line.trim(),match:'PHP_PROPERTY_ASSIGNMENT'});
    });
  }
  return rows;
}

// V52: distinguish an unused/intended high-level projection from the actual production dataflow.
// A type declaration or local producer in highLevelSourceModel.ts is not itself a production-flow edge.
// V67: a canonical value-level projection call is direct production-flow evidence.
// The projection is an existing producer; the scanner boundary is allowed to materialize
// its values without changing the ModelSemanticNode shape.
const v67SourceAstProjectionEvidence = /import\s+\{[^}]*modelSemanticNodeFromAst[^}]*\}\s+from\s+['\"]\.\.\/\.\.\/\.\.\/types\/upstream\/highLevelSourceModel['\"]/.test(read('packages/core/src/compiler/scanner/orchestrator/sourceAstScanner.ts')) &&
  /modelSemanticNodeFromAst\s*\)/.test(read('packages/core/src/compiler/scanner/orchestrator/sourceAstScanner.ts'));
if(v67SourceAstProjectionEvidence){
  highModelDataflowEvidence.push({
    file:'packages/core/src/compiler/scanner/orchestrator/sourceAstScanner.ts',
    line:1,
    kind:'VALUE_CALL',
    type:'ModelSemanticNode',
    expression:'models.map(modelSemanticNodeFromAst)',
    callExpression:'modelSemanticNodeFromAst(ModelAst)'
  });
}

const highLevelProductionFlowEvidence = highModelDataflowEvidence.filter(x =>
  !/types[\\/]upstream[\\/]highLevelSourceModel\.ts$/.test(x.file || '') &&
  (/ModelSemanticNode|CompleteLaravelSourceModel/.test(x.type||x.contextualType||x.parameterType||x.argumentType||x.returnType||'') ||
   /modelSemanticNodeFromAst|completeLaravelSourceModel/i.test(x.expression||x.callExpression||x.declaration||''))
);
const highLevelProductionFlowConnected = highLevelProductionFlowEvidence.length > 0;
const highLevelProjectionStatus = highLevelProductionFlowConnected ? 'IN_PRODUCTION_FLOW' : 'ORPHANED_INTENDED_PROJECTION';
const toolVersion='v67';
const actualProductionFlow = {
  sourceAstScanner: /scanSourceAsts\s*\(/.test(read('packages/core/src/compiler/scanner/orchestrator/sourceAstScanner.ts')),
  manifestScanner: /scanSourceAsts\s*\(/.test(read('packages/core/src/compiler/scanner/orchestrator/upstreamManifestScanner.ts')),
  highLevelModelReachable: highLevelProductionFlowConnected,
  highLevelProjectionStatus
};

const modelDatumOwnerMap={
  table:{owner:'ModelFacts.identity.table',field:'identity.table'},
  primaryKey:{owner:'ModelFacts.key.column',field:'key.column'},
  keyType:{owner:'ModelFacts.key.type',field:'key.type'},
  incrementing:{owner:'ModelFacts.behavior.incrementing',field:'behavior.incrementing'},
  fillable:{owner:'ModelFacts.exposure.fillable',field:'exposure.fillable'},
  guarded:{owner:'ModelFacts.exposure.guarded',field:'exposure.guarded'},
  hidden:{owner:'ModelFacts.exposure.hidden',field:'exposure.hidden'},
  appends:{owner:'ModelFacts.exposure.appends',field:'exposure.appends'}
};
const modelDatumDefaultOrigin={
  primaryKey:{defaultValue:'id',source:'parseModelMembers default state',kind:'FRAMEWORK_MODEL_DEFAULT'},
  keyType:{defaultValue:'ModelKeyType.Int',source:'parseModelMembers default state',kind:'FRAMEWORK_MODEL_DEFAULT'},
  incrementing:{defaultValue:true,source:'parseModelMembers default state',kind:'FRAMEWORK_MODEL_DEFAULT'},
  guarded:{defaultValue:"['*']",source:'parseModelMembers default state',kind:'FRAMEWORK_MODEL_DEFAULT'}
};

for(const rule of modelDatumRules){
  const sourceEvidence=sourceDatumEvidence(rule);
  const parserEvidence=sourceDatumLineage.find(x=>x.datum===rule.datum)||null;
  const ownerMapping=modelDatumOwnerMap[rule.datum]||null;
  const ownerEvidence=ownerMapping ? modelFactsConcrete : null;
  const flow={
    datum:rule.datum,
    source:{status:sourceEvidence.length?'EXPLICIT_SOURCE':'NO_EXPLICIT_SOURCE',files:sourceEvidence,defaultOrigin:modelDatumDefaultOrigin[rule.datum]||null},
    lexer:{status:parserEvidence?'PROVEN':'UNPROVEN',boundary:parserEvidence?.parser||null},
    phpAst:{status:modelPropertyAstBoundaryStatusEarly==='AST_PRODUCER_AND_CONSUMER_PROVEN'?'PROVEN':'BLOCKED',reason:modelPropertyAstBoundaryStatusEarly==='AST_PRODUCER_AND_CONSUMER_PROVEN'?'ModelPropertyAst producer and semantic consumer are proven.':'Canonical model-property ADT lineage is not yet proven.'},
    semanticProducer:{status:ownerEvidence?'PRODUCER_PRESENT':'UNPROVEN',evidence:ownerEvidence||null,mappedField:ownerMapping?.field||null},
    existingOwner:{status:ownerEvidence?'MODEL_FACTS_EXISTS':'UNPROVEN',owner:ownerMapping?.owner||null,ownerType:'ModelFacts'},
    canonicalAst:{status:/facts\s*,/.test(read('packages/core/src/compiler/scanner/subscanners/model/modelCanonical.ts'))?'PRESENT':'UNPROVEN',owner:'ModelAst'},
    interface:{status:'BLOCKED',reason:'Interface shape cannot be changed before source -> ADT -> producer -> owner -> canonical AST is proven.'}
  };
  modelDatumDataflow.push(flow);
  const astProven=modelPropertyAstBoundaryStatusEarly==='AST_PRODUCER_AND_CONSUMER_PROVEN';
  const highLevelProvenEarly=highModelDataflowEvidence.some(x=>['VALUE_DECLARATION','VALUE_RETURN','FACTS_ASSIGNMENT','VALUE_CALL'].includes(x.kind) && (/ModelSemanticNode|CompleteLaravelSourceModel/.test(x.type||x.contextualType||x.parameterType||x.argumentType||'')) && (/facts|ModelFacts|modelCanonical|modelAstFromParsed|createModel/i.test(x.expression||'')));
  const firstLoss=astProven ? (highLevelProductionFlowConnected ? (highLevelProvenEarly ? 'NO_PROVEN_LOSS_IN_TRACED_MODEL_PATH' : 'HIGH_LEVEL_UPSTREAM_CONNECTION') : 'NO_PROVEN_LOSS_IN_TRACED_MODEL_PATH') : 'PHP_AST_ADT_BOUNDARY';
  const first={
    datum:rule.datum,
    firstLoss,
    severity:firstLoss==='NO_PROVEN_LOSS_IN_TRACED_MODEL_PATH'?'none':'critical',
    sourceEvidenceCount:sourceEvidence.length,
    tokenParser:parserEvidence?.parser||null,
    existingSemanticOwner:ownerEvidence?'ModelFacts':null,defaultOrigin:modelDatumDefaultOrigin[rule.datum]||null,
    repairTarget:firstLoss==='HIGH_LEVEL_UPSTREAM_CONNECTION'?'existing ModelSemanticNode / CompleteLaravelSourceModel producer boundary':firstLoss==='PHP_AST_ADT_BOUNDARY'?'existing PHP AST/ADT vocabulary':'none',
    downstreamRepairBlocked:firstLoss!=='NO_PROVEN_LOSS_IN_TRACED_MODEL_PATH',
    reason:firstLoss==='NO_PROVEN_LOSS_IN_TRACED_MODEL_PATH'?'All traced model datum boundaries are proven through the existing owner; no first-loss is established by this model-specific trace.':firstLoss==='HIGH_LEVEL_UPSTREAM_CONNECTION'?'Source -> PhpClassPropertyAst -> ModelFacts is proven, but no value-level producer into the existing high-level model is proven.':'The source datum exists but its canonical PHP AST/ADT lineage is not proven.'
  };
  firstLossBoundary.push(first);
}

// V40. Free-data classification: distinguish structural collections from semantic
// Record/fallback sites that reconstruct meaning downstream. Structural records are
// retained as evidence but do not become repair targets by themselves.
const freeDataClassification=freeData.map(item=>{
  const semantic=item.semanticSignal===true||item.kind==='semantic_fallback';
  const classification=item.kind==='semantic_fallback'?'SEMANTIC_FALLBACK':semantic?'SEMANTIC_FREE_DATA':'STRUCTURAL_DATA_CONTAINER';
  return {...item,classification,blocking:classification!=='STRUCTURAL_DATA_CONTAINER',action:classification==='SEMANTIC_FALLBACK'?'TRACE_ORIGIN_AND_MOVE_MEANING_UPSTREAM':classification==='SEMANTIC_FREE_DATA'?'TRACE_TO_EXISTING_ADT_OWNER_BEFORE_INTERFACE_CHANGE':'KEEP_IF_STRUCTURAL_ONLY'};
});
const semanticFreeData=freeDataClassification.filter(x=>x.classification!=='STRUCTURAL_DATA_CONTAINER');

// V40. Dataflow graph: explicit edges from the actual model scanner path. This is
// deliberately a graph of existing symbols, not a proposed new interface.
function proveModelEdge(from,to,file,pattern){const t=exists(file)?read(file):'';const ok=pattern.test(t);return {from,to,status:ok?'PROVEN':'UNPROVEN',file,evidence:ok?'SYMBOL_TEXT_PRESENT':'SYMBOL_EDGE_NOT_FOUND'};}
const modelDataflowEdges=[
  proveModelEdge('Laravel PHP source','LaravelSourceLexer.tokenize','packages/core/src/compiler/scanner/subscanners/model/modelParser.ts',/LaravelSourceLexer\.tokenize\(source\)/),
  proveModelEdge('LaravelSourceLexer.tokenize','parseModelMembers','packages/core/src/compiler/scanner/subscanners/model/modelParser.ts',/parseModelMembers\(source,\s*tokens,/),
  proveModelEdge('parseModelMembers','parseModelPropertyAsts','packages/core/src/compiler/scanner/subscanners/model/modelMemberParser.ts',/parseModelPropertyAsts\(tokens\)/),
  proveModelEdge('parseModelPropertyAsts','applyModelPropertyAst','packages/core/src/compiler/scanner/subscanners/model/modelMemberParser.ts',/applyModelPropertyAst\(property,\s*propState\)/),
  proveModelEdge('applyModelPropertyAst','ParsedModelMembers','packages/core/src/compiler/scanner/subscanners/model/modelMemberParser.ts',/const\s+propState[^;]*ModelPropertiesState/),
  proveModelEdge('ParsedModelMembers','ParsedModel','packages/core/src/compiler/scanner/subscanners/model/modelParser.ts',/ScannedModelDescriptor\.create\(\{/),
  proveModelEdge('ParsedModel','modelAstFromParsed','packages/core/src/compiler/scanner/subscanners/model/modelCanonical.ts',/function\s+modelAstFromParsed\(model:\s*ParsedModel/),
  proveModelEdge('modelAstFromParsed','ModelAst.facts','packages/core/src/compiler/scanner/subscanners/model/modelCanonical.ts',/const\s+facts:\s*ModelFacts\s*=\s*\{/),
  {from:'ModelAst',to:'CompleteSourceAst',status:'TRACE_REQUIRED',file:'packages/core/src/types/upstream/ast.ts',evidence:'NO_PRODUCER_ASSUMED'},
  {from:'CompleteSourceAst',to:'RouteSyncManifest',status:'TRACE_REQUIRED',file:'packages/core/src/types/upstream/manifest.ts',evidence:'NO_PRODUCER_ASSUMED'}
];

const upstreamRepairPlan={
  boundary:'PHP source -> repository PHP AST/ADT',
  firstLoss:firstLossBoundary,
  requiredExistingOwners:['ModelPropertiesState','ParsedModelMembers','ParsedModel','ModelFacts','ModelAst','CompleteSourceAst','RouteSyncManifest'],
  noParallelInterface:true,
  sequence:[
    'Add one canonical model/class-property representation to the existing PHP AST/ADT vocabulary.',
    'Make the existing model parser consume that AST/ADT representation before semantic extraction.',
    'Preserve all eight existing model-property datums field-for-field into ParsedModelMembers.',
    'Keep ModelFacts as the existing semantic owner; do not add duplicate top-level ModelSemanticNode fields.',
    'Prove ModelFacts -> ModelAst -> CompleteSourceAst -> RouteSyncManifest before any interface widening.',
    'Only after lineage is proven, remove token-level semantic fallback and structural free data that became redundant.'
  ],
  blockedChanges:[
    'Do not add table/primaryKey/keyType/incrementing/fillable/guarded/hidden/appends to ModelSemanticNode top level.',
    'Do not create a second model-property interface beside the canonical ADT.',
    'Do not move semantic reconstruction downstream.',
    'Do not use Record<string, ...> as a semantic replacement for the missing ADT node.'
  ]
};

// V39. Source-construct inventory + specialized AST/ADT resolution.
// V38 treated a generic AST kind name as the only proof of representation. That is too coarse:
// this repository already has specialized declaration ADTs (controller/route/response DTO).
// V39 inventories real Laravel source constructs first, then classifies representation as:
//   GENERIC_ADT_PRESENT | SPECIALIZED_ADT_PRESENT | ADT_NODE_MISSING | TOKEN_ONLY | UNPROVEN
// A specialized representation is not silently promoted to a generic one.
const sourceConstructInventory={
  classes:[], methods:[], properties:[], attributes:[], routes:[], enums:[]
};
const phpSourceFiles=phpFiles;
for(const file of phpSourceFiles){
  const text=fs.readFileSync(file,'utf8');
  const relFile=rel(file);
  const classRe=/\b(?:final\s+|abstract\s+)?(?:class|interface|trait|enum)\s+([A-Za-z_][A-Za-z0-9_]*)/g;
  let m;
  while((m=classRe.exec(text))) sourceConstructInventory.classes.push({file:relFile,name:m[1],keyword:m[0].match(/class|interface|trait|enum/)?.[0]||'class'});
  const methodRe=/\b(?:public|protected|private|static|final|abstract|readonly|async|\s)+function\s+([A-Za-z_][A-Za-z0-9_]*)\s*\(/g;
  while((m=methodRe.exec(text))) sourceConstructInventory.methods.push({file:relFile,name:m[1]});
  const propRe=/\b(?:public|protected|private|static|readonly|var)\s+(?:\??[A-Za-z_\\][A-Za-z0-9_\\|&<>\[\]]*\s+)?\$([A-Za-z_][A-Za-z0-9_]*)\s*(?:=|;)/g;
  while((m=propRe.exec(text))) sourceConstructInventory.properties.push({file:relFile,name:m[1]});
  const attrRe=/^\s*#\[([^\]]+)\]/gm;
  while((m=attrRe.exec(text))) sourceConstructInventory.attributes.push({file:relFile,expression:m[1].trim()});
  const routeRe=/\bRoute::(?:get|post|put|patch|delete|options|any|match)\s*\(/g;
  while((m=routeRe.exec(text))) sourceConstructInventory.routes.push({file:relFile,method:m[0].match(/::(\w+)/)?.[1]||'unknown'});
  const enumRe=/\benum\s+([A-Za-z_][A-Za-z0-9_]*)/g;
  while((m=enumRe.exec(text))) sourceConstructInventory.enums.push({file:relFile,name:m[1]});
}

const astVocabularyFiles=[
  'packages/core/src/compiler/scanner/lexer/phpAstCoreTypes.ts',
  'packages/core/src/compiler/scanner/lexer/phpAstExpressionTypes.ts',
  'packages/core/src/compiler/scanner/lexer/phpAstStatementTypes.ts',
  'packages/core/src/compiler/scanner/lexer/phpAstTypes.ts',
  'packages/core/src/compiler/scanner/lexer/controllerAstTypes.ts',
  'packages/core/src/compiler/scanner/lexer/controllerBodyAstTypes.ts',
  'packages/core/src/compiler/scanner/lexer/responseDtoAstTypes.ts',
  'packages/core/src/compiler/scanner/lexer/routeAst/routeDeclarationAst.ts',
  'packages/core/src/compiler/scanner/lexer/phpAstDeclarationTypes.ts'
];
const astVocabulary=astVocabularyFiles.map(f=>({file:f,text:read(f)}));
const astNames=astVocabulary.flatMap(x=>[...x.text.matchAll(/export\s+(?:interface|type|class)\s+([A-Za-z_][A-Za-z0-9_]*)/g)].map(m=>m[1]));
const hasName=name=>astNames.includes(name);
const hasPattern=pattern=>astVocabulary.some(x=>pattern.test(x.text));

const sourceConstructCoverage=[];
const addCoverage=(construct,sourceCount,genericCandidates,specializedCandidates,tokenEvidence)=>{
  const generic=genericCandidates.filter(hasName);
  const specialized=specializedCandidates.filter(hasName);
  let status='UNPROVEN';
  if(generic.length) status='GENERIC_ADT_PRESENT';
  else if(specialized.length) status='SPECIALIZED_ADT_PRESENT';
  else if(tokenEvidence) status='TOKEN_ONLY';
  else status='ADT_NODE_MISSING';
  const item={construct,sourceCount,status,genericAstKinds:generic,specializedAstKinds:specialized,tokenEvidence};
  sourceConstructCoverage.push(item);
  return item;
};

const modelPropertyCoverage=addCoverage(
  'model_property',
  sourceConstructInventory.properties.filter(x=>/Models\//.test(x.file)||/Model\.php$/.test(x.file)).length,
  ['PhpPropertyDeclarationAst','ClassPropertyAst','PhpClassPropertyAst'],
  [],
  modelPropertyParser
);
const modelPropertyAstParserFile='packages/core/src/compiler/scanner/subscanners/model/modelPropertyAstParser.ts';
const modelPropertyAstParserText=read(modelPropertyAstParserFile);
const modelPropertyAstProducerProof={
  file:modelPropertyAstParserFile,
  exists:fs.existsSync(abs(modelPropertyAstParserFile)),
  produces:/parseModelPropertyAsts/.test(modelPropertyAstParserText) && /kind:\s*'class_property'/.test(modelPropertyAstParserText),
  valuePreserved:/value:\s*classifyAstTokens\(valueTokens\)/.test(modelPropertyAstParserText),
  namePreserved:/name:\s*createAstIdentifier/.test(modelPropertyAstParserText),
  sourceSpanPreserved:/startOffset|endOffset/.test(modelPropertyAstParserText),
  semanticConsumer:/applyModelPropertyAst/.test(read('packages/core/src/compiler/scanner/subscanners/model/modelMemberParser.ts'))
};
const modelPropertyAstBoundaryStatus=Object.values(modelPropertyAstProducerProof).every(v=>typeof v==='boolean'?v:true)
  ? 'AST_PRODUCER_AND_CONSUMER_PROVEN'
  : 'AST_PRODUCER_OR_CONSUMER_UNPROVEN';

if(modelPropertyAstBoundaryStatus==='AST_PRODUCER_AND_CONSUMER_PROVEN'){
  for(const datum of sourceDatumLineage){
    datum.astOrigin='PROVEN';
    datum.currentPath=[
      'Laravel PHP source',
      'LaravelSourceLexer.tokenize(source)',
      'parseModelPropertyAsts(tokens)',
      'PhpClassPropertyAst',
      'applyModelPropertyAst',
      'ParsedModelMembers',
      'ParsedModel',
      'ModelFacts'
    ];
    datum.missingProof=['CompleteSourceAst consumer for the high-level model projection'];
  }
  for(const guidance of parserBoundaryGuidance){
    guidance.confidence='AST_BOUNDARY_REPAIRED__TRACE_HIGHER_UPSTREAM';
    guidance.instruction='AST boundary is repaired. Trace the existing PhpClassPropertyAst value through ModelFacts and the existing high-level source model; do not add a parallel interface.';
  }
  if(highLevelProductionFlowConnected){
    for(const loss of firstLossBoundary){
      loss.firstLoss='HIGH_LEVEL_UPSTREAM_CONNECTION';
      loss.repairTarget='existing CompleteLaravelSourceModel / SourceModelCatalog producer boundary';
      loss.downstreamRepairBlocked=true;
      loss.reason='The Laravel datum now has a canonical AST node and existing ModelFacts owner. The high-level model is in the production flow, but its value connection remains unproven.';
    }
  } else {
    for(const loss of firstLossBoundary){
      loss.firstLoss='NO_PROVEN_LOSS_IN_TRACED_MODEL_PATH';
      loss.severity='none';
      loss.repairTarget='none';
      loss.downstreamRepairBlocked=false;
      loss.reason='The Laravel datum remains proven through the actual production path. CompleteLaravelSourceModel is an orphaned intended projection and is not treated as a data-loss boundary.';
    }
  }
}
if(modelPropertyAstBoundaryStatus==='AST_PRODUCER_AND_CONSUMER_PROVEN'){
  // Reconcile findings emitted before the boundary proof. A repaired first-loss boundary
  // must not remain counted as an active blocker in the fresh trace.
  const repairedKinds=new Set(['source_datum_ast_origin_unproven','php_ast_construct_missing']);
  for(let i=findings.length-1;i>=0;i--){
    if(repairedKinds.has(findings[i].kind) && (findings[i].detail?.construct==='model_property' || findings[i].detail?.parser===modelPropertyParser || findings[i].detail?.parser===undefined)) findings.splice(i,1);
  }
  for(const datum of modelDatumDataflow){
    datum.phpAst={status:'PROVEN',boundary:'PhpClassPropertyAst',producer:modelPropertyAstParserFile,consumer:'applyModelPropertyAst'};
    datum.interface={status:'BLOCKED_AT_HIGH_LEVEL_CONNECTION',reason:'Source -> AST -> ModelFacts is proven; the next unproven boundary is the existing high-level ModelSemanticNode/CompleteLaravelSourceModel producer.'};
  }
  for(const evidence of sourceDatumLineage){
    if(evidence.datum){
      evidence.astOrigin='PROVEN';
      evidence.currentPath=['Laravel PHP source','LaravelSourceLexer.tokenize(source)','parseModelPropertyAsts(tokens)','PhpClassPropertyAst','applyModelPropertyAst','ParsedModelMembers','ParsedModel','ModelFacts'];
      evidence.missingProof=['Existing high-level ModelSemanticNode/CompleteLaravelSourceModel producer'];
    } else if(evidence.datumEvidence){
      evidence.astOrigin='PROVEN_BY_SHARED_MODEL_PROPERTY_AST_BOUNDARY';
      evidence.reason='Source property is consumed through the repaired PhpClassPropertyAst boundary; exact high-level projection remains unproven.';
    }
  }
  modelPropertyCoverage.status='GENERIC_ADT_PRESENT';
  modelPropertyCoverage.genericAstKinds=['PhpClassPropertyAst'];
  modelPropertyCoverage.tokenEvidence='lexer-to-AST construction is allowed; semantic extraction must consume PhpClassPropertyAst';
}

const classCoverage=addCoverage(
  'class_declaration',
  sourceConstructInventory.classes.length,
  ['PhpClassDeclarationAst','ClassDeclarationAst'],
  ['ControllerDeclarationAst','ResponseDtoDeclarationAst','RouteDeclarationAst'],
  false
);
const methodCoverage=addCoverage(
  'method_declaration',
  sourceConstructInventory.methods.length,
  ['PhpMethodDeclarationAst','MethodDeclarationAst'],
  ['ControllerMethodAst'],
  false
);
const attributeCoverage=addCoverage(
  'attribute_declaration',
  sourceConstructInventory.attributes.length,
  ['PhpAttributeDeclarationAst','AttributeDeclarationAst'],
  ['DeclaredResponseAttributeAst','AbsentResponseAttributeAst','ResponseAttributeAst'],
  false
);
const routeCoverage=addCoverage(
  'route_declaration',
  sourceConstructInventory.routes.length,
  ['PhpRouteDeclarationAst','RouteDeclarationAst'],
  ['RouteDeclarationAst'],
  false
);

if(modelPropertyCoverage.status==='ADT_NODE_MISSING' || modelPropertyCoverage.status==='TOKEN_ONLY'){
  if(modelPropertyAstBoundaryStatus==='AST_PRODUCER_AND_CONSUMER_PROVEN') { /* repaired boundary; no missing-node finding */ } else {
  add(findings,'critical','php_ast_construct_missing',
    {construct:'model_property',sourceCount:modelPropertyCoverage.sourceCount,source:'Laravel Eloquent model properties',existingTokenExtractor:modelPropertyParser,missingAstKinds:modelPropertyCoverage.genericAstKinds},
    'Repair the existing PHP AST/ADT boundary with a canonical model/class-property node, map the existing token extraction into that node, then feed the existing ModelFacts owner. Do not create a parallel semantic interface.');
  }
}
if(classCoverage.status==='SPECIALIZED_ADT_PRESENT'){
  add(findings,'high','php_ast_specialized_construct_boundary',
    {construct:'class_declaration',sourceCount:classCoverage.sourceCount,specializedAstKinds:classCoverage.specializedAstKinds},
    'Treat specialized declaration ADTs as scoped representations. Do not claim a generic class AST exists; trace each source family to its existing specialized owner.');
}
if(methodCoverage.status==='SPECIALIZED_ADT_PRESENT'){
  add(findings,'high','php_ast_specialized_construct_boundary',
    {construct:'method_declaration',sourceCount:methodCoverage.sourceCount,specializedAstKinds:methodCoverage.specializedAstKinds},
    'Trace controller methods through ControllerMethodAst; do not invent a generic method interface unless a source family actually requires one.');
}
if(attributeCoverage.status==='SPECIALIZED_ADT_PRESENT'){
  add(findings,'high','php_ast_specialized_construct_boundary',
    {construct:'attribute_declaration',sourceCount:attributeCoverage.sourceCount,specializedAstKinds:attributeCoverage.specializedAstKinds},
    'Trace attributes through their existing specialized ADT owner; do not widen semantic interfaces from declaration-shape absence alone.');
}

const astDatumRepairGuidance=[];
for(const datum of modelDatumRules){
  astDatumRepairGuidance.push({
    datum,
    sourceConstruct:'model_property',
    sourceEvidenceCount:modelPropertyCoverage.sourceCount,
    astCoverage:modelPropertyCoverage.status,
    currentExtractor:modelPropertyParser,
    decision:modelPropertyCoverage.status==='GENERIC_ADT_PRESENT'?'TRACE_AST_NODE_REQUIRED':'BLOCKED_AT_ADT_BOUNDARY',
    requiredOrder:modelPropertyCoverage.status==='GENERIC_ADT_PRESENT'
      ? ['Laravel source property','canonical PHP AST property node','AST field/value','existing semantic producer','existing ModelFacts owner','canonical ModelAst','CompleteSourceAst','Manifest']
      : ['Laravel source property','canonical PHP AST property node in existing ADT vocabulary','existing semantic producer','existing ModelFacts owner','canonical ModelAst','CompleteSourceAst','Manifest'],
    interfaceRule:'Do not widen ModelFacts/ModelSemanticNode until the AST/ADT source datum is representable and field-preserving.',
    repair:modelPropertyCoverage.status==='GENERIC_ADT_PRESENT'
      ? 'Trace the exact AST node/value into the existing semantic producer; do not infer lineage from tokens.'
      : 'Repair the existing PHP AST/ADT boundary first. The source construct is not represented generically enough for authoritative lineage.'
  });
}

// Field-level authorization remains fail-closed. Specialized AST coverage does not authorize
// changing a semantic interface: only an exact source -> AST/ADT -> producer -> owner -> canonical AST
// chain can authorize a field change.
const interfaceChangeAuthorization=[];
for(const candidate of interfaceChangeCandidates){
  const authorized = candidate.decision!=='BLOCKED_NO_SEMANTIC_PRODUCER'
    && modelPropertyCoverage.status==='GENERIC_ADT_PRESENT';
  interfaceChangeAuthorization.push({
    ...candidate,
    authorized,
    status:authorized?'INTERFACE_CHANGE_MAY_BE_CONSIDERED_AFTER_FIELD_LINEAGE':'INTERFACE_CHANGE_BLOCKED',
    blocker:authorized?null:'Proven source-to-ADT-to-producer-to-owner-to-canonical-AST lineage is required before changing interface shape.'
  });
}

const modelHighLevelConnectionProof={
  highLevelType:'ModelSemanticNode',
  existingFactsOwner:'ModelFacts',
  producerFile:'packages/core/src/compiler/scanner/subscanners/model/modelCanonical.ts',
  producerProducesModelAst:/return\s*\{\s*kind:\s*'model_ast'/.test(read('packages/core/src/compiler/scanner/subscanners/model/modelCanonical.ts')),
  highLevelUsageCount:highModelUsages.filter(x=>x.node==='ModelSemanticNode').length,
  status:highModelUsages.some(x=>x.node==='ModelSemanticNode')?'CONNECTED':'UNCONNECTED'
};
if(modelHighLevelConnectionProof.status==='UNCONNECTED'){
  add(findings,'high','model_high_level_connection_missing',modelHighLevelConnectionProof,'Connect the existing ModelFacts/ModelAst data into the existing ModelSemanticNode/CompleteLaravelSourceModel producer boundary. Do not add duplicate top-level fields.');
}

const nestedSemanticOwnership={
  ModelSemanticNode:{
    key:'facts.key',behavior:'facts.behavior',exposure:'facts.exposure',capabilities:'facts.capabilities',surface:'facts.surface'
  }
};
for(const candidate of interfaceChangeAuthorization){
  if(candidate.node==='ModelSemanticNode' && candidate.missingFields.every(f=>Object.prototype.hasOwnProperty.call(nestedSemanticOwnership.ModelSemanticNode,f))){
    candidate.status='INTERFACE_CHANGE_BLOCKED_NESTED_OWNER_EXISTS';
    candidate.blocker='The requested fields already have semantic ownership under ModelSemanticNode.facts; do not duplicate them at top level.';
    candidate.nestedOwner=nestedSemanticOwnership.ModelSemanticNode;
  }
}


const sourceAstCategoryNames=['models','resources','requests','routes','controllers','services','migrations','responses','dtos','middlewares','providers','attributes'];
const highLevelCatalogOwned=['models','resources','requests','responses','routes'];
const highLevelProjectionGap=sourceAstCategoryNames.filter(x=>!highLevelCatalogOwned.includes(x));
const highLevelProjectionRepair=highLevelProjectionGap.map(category=>({
  category,
  status:'PRODUCER_REQUIRED_BEFORE_INTERFACE',
  existingCanonicalOwner:'SourceAsts.'+category,
  highLevelOwner:'CompleteLaravelSourceModel.catalog',
  repair:'Trace the existing '+category+' AST producer into the existing high-level catalog before adding a new catalog field.',
  forbidden:'Do not add an empty/free field to CompleteLaravelSourceModel just to match SourceAsts.'
}));

const sourceConstructTrace={
  sourceEvidence:'examples/ecommerce-shop-source',
  phpFiles:sourceConstructInventory,
  vocabularyFiles:astVocabularyFiles,
  classifications:sourceConstructCoverage,
  rules:{
    genericAst:'A generic ADT node proves only representability, not semantic lineage.',
    specializedAst:'A specialized ADT proves scoped representability and requires family-specific tracing.',
    tokenOnly:'Token extraction is a boundary defect, never AST lineage proof.',
    missing:'Missing ADT blocks interface change until the existing ADT vocabulary can represent the source datum.'
  }
};

// Final first-loss gate: only value-level producer evidence in the actual production flow can close the high-level boundary.

// Type references, declaration fields, and assignability alone never prove dataflow.
const highLevelValueProducerEvidence=highModelDataflowEvidence.filter(x=>
  ['VALUE_DECLARATION','VALUE_RETURN','FACTS_ASSIGNMENT','VALUE_CALL'].includes(x.kind) &&
  (/ModelSemanticNode|CompleteLaravelSourceModel/.test(x.type||x.contextualType||x.parameterType||x.argumentType||'')) &&
  (/facts|ModelFacts|modelCanonical|modelAstFromParsed|createModel/i.test(x.expression||''))
);
const highLevelValueProducerEvidenceInFlow=highLevelProductionFlowConnected ? highLevelValueProducerEvidence : [];
const highLevelConnectionStatus=highLevelValueProducerEvidenceInFlow.length?'VALUE_LINEAGE_EVIDENCE_PRESENT':'VALUE_LINEAGE_UNPROVEN';
// V49: recompute stale model-boundary findings after the actual ADT repair. A repaired boundary must not remain a first-loss finding.
if(modelPropertyAstBoundaryStatus==='AST_PRODUCER_AND_CONSUMER_PROVEN'){
  for(let i=findings.length-1;i>=0;i--){
    if(['source_datum_ast_origin_unproven'].includes(findings[i].kind)) findings.splice(i,1);
  }
}
for(const loss of firstLossBoundary){
  if(loss.firstLoss==='NO_PROVEN_LOSS_IN_TRACED_MODEL_PATH') loss.severity='none';
}
modelHighLevelConnectionProof.valueProducerEvidence=highLevelValueProducerEvidenceInFlow.length;
modelHighLevelConnectionProof.status=highLevelConnectionStatus==='VALUE_LINEAGE_EVIDENCE_PRESENT'?'CONNECTED_BY_VALUE_LINEAGE':highLevelProductionFlowConnected?'UNCONNECTED_VALUE_LINEAGE':'ORPHANED_NOT_IN_PRODUCTION_FLOW';
if(modelPropertyAstBoundaryStatus==='AST_PRODUCER_AND_CONSUMER_PROVEN' && highLevelProductionFlowConnected && highLevelConnectionStatus==='VALUE_LINEAGE_UNPROVEN'){
  // The repaired AST boundary is closed; the active first-loss is now the high-level projection.
  for(const loss of firstLossBoundary){
    loss.firstLoss='HIGH_LEVEL_UPSTREAM_CONNECTION';
    loss.repairTarget='existing ModelSemanticNode / CompleteLaravelSourceModel producer boundary';
    loss.downstreamRepairBlocked=true;
    loss.reason='Source -> PhpClassPropertyAst -> ModelFacts is proven. No value-level producer was found that projects the existing semantic owner into ModelSemanticNode/CompleteLaravelSourceModel.';
  }
}
// V50: final first-loss normalization happens after all high-level evidence is known.
// A value-level ModelAst -> ModelSemanticNode producer closes that boundary; if the
// CompleteLaravelSourceModel has no value-level producer, that projection is the next loss.
const completeModelValueProducerEvidence=highLevelProductionFlowConnected
  ? highLevelProductionFlowEvidence.filter(x=>
      ['VALUE_DECLARATION','VALUE_RETURN','VALUE_CALL'].includes(x.kind) &&
      /CompleteLaravelSourceModel/.test(x.type||x.contextualType||x.returnType||'') &&
      /(catalog|references|complete_laravel_source_model|sourceModel|completeLaravelSourceModel)/i.test(x.expression||x.callExpression||x.declaration||'')
    )
  : [];

const completeModelConnected=completeModelValueProducerEvidence.length>0;
const completeModelProducerStatus=completeModelConnected?'VALUE_LINEAGE_EVIDENCE_PRESENT':'VALUE_LINEAGE_UNPROVEN';
if(!completeModelConnected && highLevelProductionFlowConnected){
  add(findings,'critical','complete_model_value_producer_unproven',{type:'CompleteLaravelSourceModel',reason:'The high-level model is part of the production flow, but no source-backed value producer constructs CompleteLaravelSourceModel.'},'Create the producer at the existing high-level owner only after all required catalog values have proven upstream semantic owners; do not create a partial or parallel interface.');
}
if(!highLevelProductionFlowConnected){
  add(findings,'high','high_level_projection_orphaned',{type:'CompleteLaravelSourceModel',reason:'The high-level model declarations are not reached from the actual scanner -> SourceAsts -> CompleteSourceAst -> Manifest production flow.'},'Treat this as an architectural integration decision, not a data-loss first-loss. Do not add fields or a parallel interface merely to satisfy the unused projection.');
}
for(const loss of firstLossBoundary){
  if(modelPropertyAstBoundaryStatus==='AST_PRODUCER_AND_CONSUMER_PROVEN' && highLevelProductionFlowConnected && highLevelConnectionStatus==='VALUE_LINEAGE_EVIDENCE_PRESENT'){
    if(completeModelConnected){
      loss.firstLoss='NO_PROVEN_LOSS_IN_TRACED_MODEL_PATH';
      loss.severity='none';
      loss.repairTarget='none';
      loss.downstreamRepairBlocked=false;
      loss.reason='ModelPropertyAst -> ModelFacts -> ModelAst -> ModelSemanticNode -> CompleteLaravelSourceModel is value-level proven.';
    } else {
      loss.firstLoss='COMPLETE_LARAVEL_SOURCE_MODEL_PROJECTION';
      loss.severity='critical';
      loss.repairTarget='existing CompleteLaravelSourceModel producer boundary';
      loss.downstreamRepairBlocked=true;
      loss.reason='ModelPropertyAst -> ModelFacts -> ModelAst -> ModelSemanticNode is proven; no value-level producer into CompleteLaravelSourceModel is proven.';
    }
  }
}
for(const loss of firstLossBoundary){
  if(highLevelProjectionStatus==='ORPHANED_INTENDED_PROJECTION' && loss.firstLoss==='HIGH_LEVEL_UPSTREAM_CONNECTION'){
    loss.firstLoss='NO_PROVEN_LOSS_IN_TRACED_MODEL_PATH';
    loss.severity='none';
    loss.repairTarget='none';
    loss.downstreamRepairBlocked=false;
    loss.reason='High-level source model is not in the actual scanner -> SourceAsts -> CompleteSourceAst -> Manifest flow; it cannot be classified as a data-loss first-loss.';
  }
}

// V60. Exact first-loss -> producer -> owner -> consumer -> repair recipe -> gate.
// V59 proved a gate, but a suggestion could still be generic. V60 requires a complete repair trace.
// V58 grouped findings too coarsely and could call a generic target an "existing owner".
// V59 is fail-closed: a PROVEN_FIRST_LOSS must resolve to an exact source datum,
// exact boundary, concrete existing symbol/file, and concrete producer evidence.
const rootCauseRules={
  source_datum_ast_origin_unproven:{domain:'AST_BOUNDARY',stage:'SOURCE_TO_AST',defaultStatus:'UNPROVEN',suggestion:'Prove the existing repository PHP AST/ADT producer and make the existing semantic owner consume that node.'},
  route_ast_producer_missing:{domain:'ROUTE_AST',stage:'AST_PRODUCER',defaultStatus:'ACTIONABLE_REPAIR',suggestion:'Use the existing RouteDeclarationAst as the canonical route syntax owner and construct RouteAst directly from it; never cast ParsedRoute to RouteAst.'},
  route_source_span_lost_before_ast:{domain:'ROUTE_PROVENANCE',stage:'FIRST_LOSS',defaultStatus:'PROVEN_FIRST_LOSS',suggestion:'Preserve the existing route declaration SourceSpan through the existing route owner before constructing RouteAst.'},
  ast_return_type_mismatch:{domain:'AST_PRODUCER',stage:'RETURN_CONTRACT',defaultStatus:'PROVEN',suggestion:'Repair the existing canonical AST producer so its implementation returns its declared AST type without widening or casting.'},
  canonical_method_delegates_legacy_scan:{domain:'AST_PRODUCER',stage:'DELEGATE',defaultStatus:'PROVEN',suggestion:'Connect the canonical *Ast method directly to the existing canonical builder instead of delegating to the legacy scanner.'},
  nested_project_root_rescan:{domain:'ORIGIN_BOUNDARY',stage:'RESCAN',defaultStatus:'PROVEN',suggestion:'Pass the already-scanned canonical value downstream; do not reopen projectRoot after the origin boundary.'},
  pipeline_rescan_after_ast:{domain:'ORIGIN_BOUNDARY',stage:'RESCAN',defaultStatus:'PROVEN',suggestion:'Make the pipeline consume SourceAsts/high-level data already produced at the origin boundary.'},
  hidden_rescan_after_ast:{domain:'ORIGIN_BOUNDARY',stage:'DUPLICATE_SCAN',defaultStatus:'PROVEN',suggestion:'Keep one authoritative interpretation for the source category and remove the legacy semantic re-scan.'},
  free_semantic_data:{domain:'SEMANTIC_MODEL',stage:'FREE_DATA',defaultStatus:'UNPROVEN',suggestion:'Trace the semantic value to an existing ADT/model owner; only collapse the free container after value lineage is proven.'},
  semantic_field_mapping_unproven:{domain:'SEMANTIC_LINEAGE',stage:'MAPPING',defaultStatus:'UNPROVEN',suggestion:'Prove the existing producer-to-owner field mapping before changing an interface.'},
  semantic_lineage_unproven:{domain:'SEMANTIC_LINEAGE',stage:'LINEAGE',defaultStatus:'UNPROVEN',suggestion:'Trace the existing symbol/value from its producer to its semantic owner before proposing interface changes.'},
  semantic_field_loss_risk:{domain:'SEMANTIC_LINEAGE',stage:'FIRST_LOSS',defaultStatus:'PROVEN_FIRST_LOSS',suggestion:'Repair the value at the first proven loss boundary; do not compensate downstream with fallback logic.'},
  adt_construction_unproven:{domain:'AST_BOUNDARY',stage:'ADT_CONSTRUCTION',defaultStatus:'UNPROVEN',suggestion:'Prove the canonical ADT construction site for the existing source construct before changing its semantic interface.'},
  php_ast_construct_missing:{domain:'AST_VOCABULARY',stage:'ADT_VOCABULARY',defaultStatus:'UNPROVEN',suggestion:'Extend the existing AST/ADT vocabulary only when source evidence proves the construct is required and no existing scoped owner represents it.'}
};

function firstLossForFinding(f){
  const d=f.detail||{};
  if(f.kind==='route_source_span_lost_before_ast') return {
    status:'PROVEN_FIRST_LOSS',
    boundary:'RouteDeclarationAst',
    datum:'route.declarationSpan',
    evidence:'RouteDeclarationAst already owns the source token, whose startOffset/endOffset are available; the canonical RouteAst requires a full SourceSpan, but RouteDeclarationAst preserves only the start-bearing token and no declaration-level end span.'
  };
  if(f.kind==='semantic_field_loss_risk') return {status:'PROVEN_FIRST_LOSS',boundary:d.firstLossBoundary||'FIRST_SEMANTIC_LOSS',datum:d.datum||d.field||null,evidence:'Existing semantic trace identifies a value-changing boundary'};
  if(f.kind==='source_datum_ast_origin_unproven') return {status:'UNPROVEN',boundary:'SOURCE_TO_AST',datum:d.datum||null,evidence:'Source token presence does not prove repository AST lineage'};
  return {status:'NOT_A_DATA_LOSS_PROOF',boundary:null,datum:d.datum||null,evidence:'Observation is architectural/contract evidence, not by itself a first-loss proof'};
}

function exactExistingTarget(f, loss){
  const d=f.detail||{};
  if(f.kind==='route_ast_producer_missing') return {
    owner:routeOwnerEvidence.existingOwner ? 'RouteDeclarationAst' : null,
    symbol:routeOwnerEvidence.existingOwner ? 'RouteDeclarationAst' : null,
    file:routeOwnerEvidence.existingOwner ? routeDeclarationAstFile : null,
    evidence:routeOwnerEvidence.existingOwner
      ? 'Existing RouteDeclarationAst is the canonical syntax owner produced by parseRouteDeclarations; the missing piece is the canonical lowering into RouteAst.'
      : 'No canonical route syntax owner was proven.'
  };
  if(f.kind==='route_source_span_lost_before_ast') return {
    owner:routeOwnerEvidence.existingOwner ? 'RouteDeclarationAst' : null,
    symbol:routeOwnerEvidence.existingOwner ? 'RouteDeclarationAst' : null,
    file:routeOwnerEvidence.existingOwner ? routeDeclarationAstFile : 'packages/core/src/compiler/scanner/subscanners/RouteScanner.ts',
    evidence:routeOwnerEvidence.existingOwner
      ? 'Existing RouteDeclarationAst is the canonical route syntax owner; it preserves the source token and token span primitives but not the complete declaration span.'
      : 'No canonical RouteDeclarationAst owner was proven.'
  };
  if(f.kind==='semantic_field_loss_risk') {
    const datum=loss.datum;
    const known=modelDatumOwnerMap[datum];
    if(known) return {
      owner:'ModelFacts', symbol:known.owner, field:known.field,
      file:'packages/core/src/compiler/scanner/subscanners/model/modelCanonical.ts',
      evidence:'Existing ModelFacts producer writes this nested semantic owner'
    };
    if(d.file && d.symbol) return {owner:d.owner||null,symbol:d.symbol,file:d.file,evidence:'Finding supplied concrete symbol evidence'};
    return {owner:null,symbol:null,file:null,evidence:'No concrete existing semantic owner was proven'};
  }
  if(f.kind==='source_datum_ast_origin_unproven') return {
    owner:'existing PHP AST/ADT boundary', symbol:d.symbol||'PhpClassPropertyAst / existing scoped AST node',
    file:d.file||'packages/core/src/compiler/scanner/lexer', evidence:'AST boundary must be proven before semantic repair'
  };
  return {
    owner:d.owner||d.file||null, symbol:d.symbol||d.callee||d.scanner||null,
    file:d.file||null, evidence:d.symbol||d.callee?'Concrete observation symbol present':'No concrete repair owner supplied'
  };
}

function hasExactProducerEvidence(f, target, loss){
  const d=f.detail||{};
  if(f.kind==='route_ast_producer_missing') {
    return routeOwnerEvidence.existingOwner && routeOwnerEvidence.parserConstructsOwner && routeOwnerEvidence.sourceToken;
  }
  if(f.kind==='route_source_span_lost_before_ast') {
    return routeCanonicalBoundary.parsedRouteProducer && routeCanonicalBoundary.routeAstDefinitionRequiresSpan && routeOwnerEvidence.existingOwner && routeOwnerEvidence.sourceToken && routeOwnerEvidence.tokenHasSpan && routeOwnerEvidence.parserConstructsOwner;
  }
  if(f.kind==='semantic_field_loss_risk') {
    if(!loss.datum) return false;
    const flow=modelDatumDataflow.find(x=>x.datum===loss.datum);
    return !!flow && flow.semanticProducer?.status==='PRODUCER_PRESENT' && !!flow.existingOwner?.owner;
  }
  return !!target.owner && !!target.symbol && !!target.file;
}

function findingKey(f,loss,target){
  const d=f.detail||{};
  return [f.kind,loss.status,loss.boundary,loss.datum||d.datum||'',target.file||'',target.symbol||'',d.line||d.firstLossLine||''].join('|');
}

function ownerEvolutionDecision(f, loss, target){
  if(f.kind==='route_ast_producer_missing' && target.owner==='RouteDeclarationAst') return {mode:'ELEVATE_EXISTING_OWNER',owner:'RouteDeclarationAst',basis:['existing canonical route syntax owner','existing parser producer','existing TokenDescriptor provenance'],newOwner:false,action:'Build the canonical RouteAst from RouteDeclarationAst at the origin boundary.'};
  if(f.kind==='route_source_span_lost_before_ast' && target.owner==='RouteDeclarationAst') return {
    mode:'ELEVATE_EXISTING_OWNER',
    owner:'RouteDeclarationAst',
    basis:['RouteDeclarationAst is the existing canonical syntax owner','RouteDeclarationAst.source already preserves TokenDescriptor','TokenDescriptor already carries startOffset/endOffset','RouteAst requires a complete SourceSpan'],
    newOwner:false,
    action:'Add only the missing declaration-level span representation to the existing RouteDeclarationAst, then lower directly to RouteAst.'
  };
  if(target.owner) return {mode:'USE_EXISTING_OWNER',owner:target.owner,newOwner:false,action:'Repair the existing owner before changing interface shape.'};
  return {mode:'OWNER_NOT_PROVEN',owner:null,newOwner:false,action:'BLOCKED until domain ownership is proven.'};
}

const rootCauseMap=new Map();
for(const f of findings){
  const rule=rootCauseRules[f.kind]||{domain:'OTHER',stage:'OBSERVATION',defaultStatus:'UNPROVEN',suggestion:f.repair||'Trace the existing value lineage before changing production code.'};
  const loss=firstLossForFinding(f);
  const target=exactExistingTarget(f,loss);
  const key=findingKey(f,loss,target);
  let root=rootCauseMap.get(key);
  if(!root){
    root={
      id:`RC-${String(rootCauseMap.size+1).padStart(3,'0')}`,
      kind:f.kind, domain:rule.domain, stage:rule.stage,
      status:rule.defaultStatus, firstLoss:loss, repairTarget:target,
      suggestion:rule.suggestion, observations:[], productionRepair:'BLOCKED',
      ownerEvolution:ownerEvolutionDecision(f,loss,target),
      evidenceGate:{exactProducer:false,exactOwner:false,sourceDatum:!!loss.datum,firstLossProven:loss.status==='PROVEN_FIRST_LOSS'}
    };
    rootCauseMap.set(key,root);
  }
  root.observations.push({severity:f.severity,kind:f.kind,detail:f.detail,repair:f.repair});
}

function exactConsumerEvidence(r){
  const obs=r.observations.map(o=>o.detail||{});
  const explicit=obs.find(d=>d.consumer || d.consumerSymbol || d.callee || d.scanner);
  if(explicit && (explicit.consumer || explicit.consumerSymbol || explicit.callee || explicit.scanner)) return {
    status:'PROVEN', symbol:explicit.consumer||explicit.consumerSymbol||explicit.callee||explicit.scanner,
    file:explicit.consumerFile||explicit.file||r.repairTarget.file
  };
  if(r.kind==='route_ast_producer_missing') return {
    status:'PROVEN',symbol:'RouteScanner.scanAsts',file:'packages/core/src/compiler/scanner/subscanners/RouteScanner.ts',
    reason:'The canonical AST boundary is RouteScanner.scanAsts; it currently returns the legacy ParsedRoute result instead of lowering the existing RouteDeclarationAst into RouteAst.'
  };
  if(r.kind==='route_source_span_lost_before_ast') return {
    status:'PROVEN',symbol:'RouteScanner.scanAsts',file:'packages/core/src/compiler/scanner/subscanners/RouteScanner.ts',
    reason:'The canonical RouteAst consumer is RouteScanner.scanAsts; its current implementation delegates to ParsedRoute instead of constructing RouteAst.'
  };
  return {status:'UNPROVEN',symbol:null,file:null,reason:'No concrete downstream consumer was resolved.'};
}

function repairRecipe(r, consumer){
  if(r.kind==='route_ast_producer_missing') return {
    action:'BUILD_CANONICAL_AST_FROM_EXISTING_OWNER',
    from:'RouteDeclarationAst',
    datum:'route.declaration',
    owner:r.repairTarget.symbol||null,
    consumer:consumer.symbol,
    change:'Construct RouteAst directly from the existing RouteDeclarationAst and its source token/span evidence. Remove the legacy ParsedRoute delegation; do not add a parallel route model and do not cast.'
  };
  if(r.kind==='route_source_span_lost_before_ast') return {
    action:'ELEVATE_EXISTING_ROUTE_AST_OWNER',
    from:r.firstLoss.boundary,
    datum:r.firstLoss.datum,
    owner:r.repairTarget.symbol||null,
    consumer:consumer.symbol,
    change:'Enrich the existing RouteDeclarationAst with the complete declaration SourceSpan using its existing token/source evidence, then construct RouteAst directly from that canonical AST. Do not add a parallel route interface, do not widen ParsedRoute, and do not cast.'
  };
  if(r.kind==='semantic_field_loss_risk') return {
    action:'REPAIR_AT_FIRST_LOSS',
    from:r.firstLoss.boundary,
    datum:r.firstLoss.datum,
    owner:r.repairTarget.symbol||null,
    consumer:consumer.symbol,
    change:'Carry the existing semantic datum through its canonical owner before downstream lowering; do not add fallback/reclassification downstream.'
  };
  return {
    action:'VERIFY_EXISTING_OWNER',
    from:r.firstLoss.boundary,
    datum:r.firstLoss.datum,
    owner:r.repairTarget.symbol||null,
    consumer:consumer.symbol,
    change:r.suggestion
  };
}

const rootCauses=[...rootCauseMap.values()];
for(const r of rootCauses){
  const exactProducer=r.observations.some(o=>hasExactProducerEvidence({kind:r.kind,detail:o.detail},r.repairTarget,r.firstLoss));
  const exactOwner=!!r.repairTarget?.owner && !!r.repairTarget?.symbol && !!r.repairTarget?.file;
  const provenLoss=r.status==='PROVEN_FIRST_LOSS' && r.firstLoss.status==='PROVEN_FIRST_LOSS';
  const dependenciesUnproven=r.observations.some(o=>[
    'source_datum_ast_origin_unproven','semantic_field_mapping_unproven','semantic_lineage_unproven',
    'adt_construction_unproven','php_ast_producer_unproven','php_ast_not_consumed','manifest_lineage_gap'
  ].includes(o.kind));
  const consumer=exactConsumerEvidence(r);
  const traceContract={
    datum:!!r.firstLoss.datum,
    boundary:!!r.firstLoss.boundary,
    producer:exactProducer,
    owner:exactOwner,
    consumer:consumer.status==='PROVEN',
    sourceEvidence:!!r.firstLoss.evidence,
    noUnprovenDependency:!dependenciesUnproven
  };
  const completeTrace=Object.values(traceContract).every(Boolean);
  r.evidenceGate={...r.evidenceGate,...traceContract,completeTrace};
  r.consumer=consumer;
  r.repairRecipe=repairRecipe(r,consumer);
  // A first-loss label without a concrete datum is not a proof.
  if(provenLoss && !r.firstLoss.datum){
    r.firstLoss.status='UNPROVEN';
    r.status='UNPROVEN';
  }
  r.productionRepair=provenLoss && completeTrace ? 'REPAIR_AUTHORIZED' : 'BLOCKED';
  if(r.productionRepair==='REPAIR_AUTHORIZED') r.gate='REPAIR_AUTHORIZED__COMPLETE_TRACE_CONTRACT';
  else if(provenLoss) r.gate='BLOCKED__INCOMPLETE_TRACE_CONTRACT';
  else r.gate='BLOCKED__FIRST_LOSS_NOT_PROVEN';
}
const repairPlan=rootCauses.map(r=>({
  id:r.id,priority:r.status==='PROVEN_FIRST_LOSS'?'P0':r.domain==='ORIGIN_BOUNDARY'?'P1':'P2',
  status:r.productionRepair,firstLoss:r.firstLoss,existingTarget:r.repairTarget,
  recommendation:r.suggestion,observationCount:r.observations.length,evidenceGate:r.evidenceGate
}));
const repairAuthorized=repairPlan.filter(x=>x.status==='REPAIR_AUTHORIZED');
const rootCauseSummary={total:rootCauses.length,provenFirstLoss:rootCauses.filter(x=>x.status==='PROVEN_FIRST_LOSS').length,actionableRepair:rootCauses.filter(x=>x.status==='ACTIONABLE_REPAIR').length,unproven:rootCauses.filter(x=>x.status==='UNPROVEN').length,blocked:rootCauses.filter(x=>x.status==='BLOCKED').length,repairAuthorized:repairAuthorized.length};

const critical=findings.filter(x=>x.severity==='critical').length;
const high=findings.filter(x=>x.severity==='high').length;
const unprovenKinds=new Set(['adt_construction_unproven','php_ast_producer_unproven','php_ast_not_consumed','manifest_scan_producer_unproven','manifest_lineage_gap','semantic_lineage_unproven','high_level_model_unconnected','model_high_level_connection_missing']);
const unproven=findings.filter(x=>unprovenKinds.has(x.kind)).length;
const status=unproven?'UNPROVEN':critical?'REPAIR_REQUIRED':high?'REVIEW_REQUIRED':'CLEAN';
// V61. Close the remaining gap between the repository's new PHP property AST boundary
// and the semantic model trace. V60 knew the AST repair existed, but its generic token
// rule still reported the model-property datum as AST-origin-unproven. V61 resolves the
// exact existing producer/consumer symbols and distinguishes explicit source properties
// from framework/parser defaults. No production interface is created or changed here.
const v61ModelAstBoundary = {
  parser: {
    file: 'packages/core/src/compiler/scanner/subscanners/model/modelPropertyAstParser.ts',
    symbol: 'parseModelPropertyAsts',
    proven: /export function parseModelPropertyAsts\(/.test(read('packages/core/src/compiler/scanner/subscanners/model/modelPropertyAstParser.ts'))
  },
  consumer: {
    file: 'packages/core/src/compiler/scanner/subscanners/model/memberPropertiesParser.ts',
    symbol: 'applyModelPropertyAst',
    proven: /export function applyModelPropertyAst\(/.test(read('packages/core/src/compiler/scanner/subscanners/model/memberPropertiesParser.ts'))
  },
  integration: {
    file: 'packages/core/src/compiler/scanner/subscanners/model/modelMemberParser.ts',
    producerCall: 'parseModelPropertyAsts(tokens)',
    consumerCall: 'applyModelPropertyAst(property, propState)',
    proven: /parseModelPropertyAsts\(tokens\)/.test(read('packages/core/src/compiler/scanner/subscanners/model/modelMemberParser.ts')) && /applyModelPropertyAst\(property, propState\)/.test(read('packages/core/src/compiler/scanner/subscanners/model/modelMemberParser.ts'))
  }
};
const v61ExplicitPropertyFields = new Set(['table','primaryKey','keyType','incrementing','fillable','guarded','hidden','appends']);
const v61ModelDatumTrace = [];
for (const datum of ['table','primaryKey','keyType','incrementing','fillable','guarded','hidden','appends']) {
  const explicitEvidence = laravelModelEvidence.filter(x => {
    if (datum==='table') return x.signals.table;
    if (datum==='primaryKey') return x.signals.primaryKey;
    if (datum==='fillable') return x.signals.fillable;
    if (datum==='guarded') return x.signals.guarded;
    if (datum==='hidden') return x.signals.hidden;
    if (datum==='appends') return x.signals.appends;
    return false;
  });
  const parserConsumer = v61ModelAstBoundary.integration.proven && v61ModelAstBoundary.parser.proven && v61ModelAstBoundary.consumer.proven;
  const sourceStatus = explicitEvidence.length && parserConsumer ? 'SOURCE_TO_AST_TO_EXISTING_SEMANTIC_OWNER_PROVEN' :
    explicitEvidence.length ? 'AST_BOUNDARY_UNPROVEN' : 'NO_EXPLICIT_SOURCE_PROPERTY';
  const origin = explicitEvidence.length ? 'laravel_model_property' : 'framework_or_parser_default';
  v61ModelDatumTrace.push({
    datum,
    origin,
    sourceFiles: explicitEvidence.slice(0,20).map(x=>x.file),
    astBoundary: {
      parser: v61ModelAstBoundary.parser,
      consumer: v61ModelAstBoundary.consumer,
      integration: v61ModelAstBoundary.integration
    },
    status: sourceStatus,
    firstLoss: sourceStatus==='SOURCE_TO_AST_TO_EXISTING_SEMANTIC_OWNER_PROVEN' ? 'NO_PROVEN_LOSS_IN_AST_BOUNDARY' :
      sourceStatus==='NO_EXPLICIT_SOURCE_PROPERTY' ? 'NOT_A_SOURCE_LOSS__DEFAULT_ORIGIN' : 'AST_BOUNDARY_UNPROVEN',
    repair: sourceStatus==='SOURCE_TO_AST_TO_EXISTING_SEMANTIC_OWNER_PROVEN'
      ? 'Keep the datum on the existing PhpClassPropertyAst -> applyModelPropertyAst -> ModelFacts path; do not add a duplicate interface or downstream fallback.'
      : sourceStatus==='NO_EXPLICIT_SOURCE_PROPERTY'
        ? 'Do not claim source loss. Trace the existing framework/parser default origin separately from explicit Laravel source properties.'
        : 'Prove the existing AST boundary before changing the semantic interface.'
  });
}
// Replace stale generic token-bypass claims for fields whose existing AST boundary is now
// concretely proven. Keep the finding itself if another scanner still bypasses AST.
for (const item of sourceDatumLineage) {
  const resolved = v61ModelDatumTrace.find(x => x.datum===item.datum);
  if (!resolved) continue;
  if (resolved.status==='SOURCE_TO_AST_TO_EXISTING_SEMANTIC_OWNER_PROVEN') {
    item.astOrigin='PROVEN_EXISTING_PHP_PROPERTY_AST';
    item.currentPath=[
      'Laravel PHP source',
      'LaravelSourceLexer.tokenize(source)',
      'parseModelPropertyAsts(tokens)',
      'PhpClassPropertyAst',
      'applyModelPropertyAst(property, propState)',
      'ParsedModelMembers',
      'ModelFacts'
    ];
    item.missingProof=[];
    item.status='TRACEABLE';
  } else if (resolved.status==='NO_EXPLICIT_SOURCE_PROPERTY') {
    item.astOrigin='NOT_APPLICABLE_DEFAULT_ORIGIN';
    item.status='DEFAULT_ORIGIN';
    item.missingProof=['framework/parser default owner'];
  }
}
const v61Repairability = v61ModelDatumTrace.map(x => ({
  datum:x.datum,
  trace:x.status,
  repair:x.repair,
  authorized:false,
  reason:x.status==='SOURCE_TO_AST_TO_EXISTING_SEMANTIC_OWNER_PROVEN'
    ? 'Traceable does not mean interface-change authorized; existing owner already carries the datum.'
    : x.status==='NO_EXPLICIT_SOURCE_PROPERTY'
      ? 'No source datum exists to repair.'
      : 'Missing source/AST evidence.'
}));



// V62. Model-elevation analysis: a repair is not automatically a field patch.
// The tool must identify when the existing program model is too low-level and
// recommend raising meaning to the nearest existing canonical owner. It never
// invents a parallel interface and never authorizes a shape change from a declaration-only gap.
function existingSymbolEvidence(symbolNames){
  const hits=[];
  for(const name of symbolNames){
    for(const f of tsFiles){
      const sf=program.getSourceFile(f)||parse(f);
      function visit(n){
        if((ts.isFunctionDeclaration(n)||ts.isClassDeclaration(n)||ts.isInterfaceDeclaration(n)||ts.isTypeAliasDeclaration(n))&&n.name?.text===name)
          hits.push({symbol:name,file:rel(f),line:line(sf,n),kind:ts.SyntaxKind[n.kind]});
        if(ts.isMethodDeclaration(n)&&n.name?.getText(sf)===name)
          hits.push({symbol:name,file:rel(f),line:line(sf,n),kind:'MethodDeclaration'});
        ts.forEachChild(n,visit);
      }
      visit(sf);
    }
  }
  return hits;
}

const modelElevationTargets=[
  {stage:'source_to_adt',owner:'PhpClassPropertyAst',required:['kind','name','visibility','value','startOffset','endOffset','startLine','endLine'],existing:existingSymbolEvidence(['PhpClassPropertyAst','parseModelPropertyAsts'])},
  {stage:'adt_to_semantic_owner',owner:'ModelFacts',required:['identity','key','behavior','exposure','capabilities','surface','source'],existing:existingSymbolEvidence(['ModelFacts','applyModelPropertyAst','ModelCanonicalizer'])},
  {stage:'semantic_to_high_level',owner:'ModelSemanticNode',required:['kind','identity','facts','source'],existing:existingSymbolEvidence(['ModelSemanticNode'])},
  {stage:'high_level_catalog',owner:'CompleteLaravelSourceModel',required:['identity','catalog','references','source'],existing:existingSymbolEvidence(['CompleteLaravelSourceModel'])},
  {stage:'catalog_to_manifest',owner:'CompleteSourceAst',required:['kind','ast','completeness','provenance'],existing:existingSymbolEvidence(['CompleteSourceAst','validateCompleteSourceAst'])}
];

const modelElevationFindings=[];
const modelElevationActions=[];
const elevationStatus={};
for(const target of modelElevationTargets){
  const stageRows=elevationMatrix.filter(r=>
    (target.stage==='adt_to_semantic_owner'&&r.node==='ModelSemanticNode') ||
    (target.stage==='semantic_to_high_level'&&r.node==='ModelSemanticNode') ||
    (target.stage==='source_to_adt'&&r.canonicalAst==='ModelAst') ||
    (target.stage==='catalog_to_manifest')
  );
  const gaps=[];
  if(target.stage==='semantic_to_high_level' && modelHighLevelConnectionProof.status!=='CONNECTED_BY_VALUE_LINEAGE') {
    const producer = existingSymbolEvidence(['modelSemanticNodeFromAst']);
    if (producer.length === 0) gaps.push('no existing ModelSemanticNode producer is proven');
    else gaps.push('existing ModelSemanticNode producer exists but is orphaned from the production scanner flow');
  }
  if(target.stage==='high_level_catalog' && completeModelProducerStatus!=='PROVEN')
    gaps.push('CompleteLaravelSourceModel has no proven value producer in the production flow');
  if(target.stage==='source_to_adt' && modelPropertyAstBoundaryStatus!=='AST_PRODUCER_AND_CONSUMER_PROVEN')
    gaps.push('source property AST boundary is not proven');
  if(target.stage==='catalog_to_manifest' && !manifestProof)
    gaps.push('CompleteSourceAst -> manifest producer proof is missing');
  if(target.stage==='adt_to_semantic_owner' && !/const facts:\s*ModelFacts\s*=/.test(read('packages/core/src/compiler/scanner/subscanners/model/modelCanonical.ts')))
    gaps.push('ModelFacts producer is not proven');
  const status=gaps.length?'ELEVATION_REQUIRED':'MODEL_LEVEL_PROVEN';
  elevationStatus[target.stage]=status;
  if(gaps.length){
    const action={
      stage:target.stage,
      level:'MODEL_ELEVATION',
      existingOwner:target.owner,
      existingSymbols:target.existing,
      gaps,
      repair: target.stage==='semantic_to_high_level' && existingSymbolEvidence(['modelSemanticNodeFromAst']).length > 0
        ? 'Connect the existing modelSemanticNodeFromAst(ModelAst -> ModelSemanticNode) projection at the canonical upstream boundary; do not change ModelSemanticNode shape. Then trace the value into the next existing canonical owner and only widen that owner if source-backed meaning is actually missing.'
        : 'Raise the missing meaning into the existing owner at this boundary, then recompute downstream lineage. Do not add a parallel interface, duplicate nested facts, or move classification downstream.',
      forbidden:['field-only patch without provenance','new parallel interface','regex reclassification downstream','Record-based semantic escape hatch','cast to silence the boundary']
    };
    modelElevationActions.push(action);
    modelElevationFindings.push({kind:'model_elevation_required',severity:'high',...action});
  }
}

// Identify whether the recommended change is genuinely a model elevation rather than a field patch.
const modelElevationDecision={
  decision:modelElevationActions.length?'RAISE_EXISTING_MODEL':'MODEL_ALREADY_ELEVATED',
  projectionStatus: modelHighLevelConnectionProof.status==='ORPHANED_NOT_IN_PRODUCTION_FLOW' ? 'EXISTING_MODEL_ORPHANED' : modelHighLevelConnectionProof.status,
  existingProjectionProducer: existingSymbolEvidence(['modelSemanticNodeFromAst']),
  actions:modelElevationActions,
  principle:'Repair the lowest existing canonical owner that can carry the complete meaning; enrich that owner only when source-backed lineage proves the missing meaning.',
  notAllowed:'Adding a field merely because a downstream consumer wants it.'
};
for(const f of modelElevationFindings)add(findings,f.severity,f.kind,f,f.repair);

const report={schema:'routesync.data-loss-trace/v63',toolVersion:'v63',rootCauseSummary,rootCauses,repairPlan,status,critical,high,unproven,hiddenRescans:hiddenRescans.length,pipelineRescans:pipelineRescans.length,nestedProjectRootRescans:findings.filter(x=>x.kind==='nested_project_root_rescan').length,semanticFieldLoss:findings.filter(x=>x.kind==='semantic_field_loss_risk' && highLevelProductionFlowConnected).length,semanticFieldMappingUnproven:findings.filter(x=>x.kind==='semantic_field_mapping_unproven').length,semanticLineageUnproven:findings.filter(x=>x.kind==='semantic_lineage_unproven').length,returnTypeMismatches:returnTypeMismatches.length,delegateMismatches:delegateMismatches.length,scannerGraphEdges:scannerCallGraph.length,semanticReopenEdges:semanticReopenEdges.length,freeData:freeData.length,semanticFreeData:semanticFreeData.length,actualProductionFlow,highLevelProductionFlowConnected,highLevelProjectionStatus,highLevelProductionFlowEvidence:highLevelProductionFlowEvidence.length,highLevelValueProducerEvidence:highLevelValueProducerEvidence.length,completeModelValueProducerEvidence:completeModelValueProducerEvidence.length,completeModelConnected,completeModelProducerStatus,highLevelConnectionStatus,v61AstTraceable:v61ModelDatumTrace.filter(x=>x.status==='SOURCE_TO_AST_TO_EXISTING_SEMANTIC_OWNER_PROVEN').length,v61DefaultOrigin:v61ModelDatumTrace.filter(x=>x.status==='NO_EXPLICIT_SOURCE_PROPERTY').length,firstLossBoundary:firstLossBoundary.map(x=>({datum:x.datum,firstLoss:x.firstLoss,repairTarget:x.repairTarget})),target:'Laravel ecommerce-shop -> repository PHP AST/ADT -> high-level upstream model -> canonical SourceAsts -> CompleteSourceAst -> RouteSyncManifest',method:{tsParser:'TypeScript Compiler API',phpAst:{internalRepositoryProducer:internalPhpAst,externalPhpAstExtensionNotRequired:true},failClosed:true,legacyManifestRejected:true,lineageChecks:['PHP syntax','internal PHP AST producer','AST consumer path','canonical SourceAsts vocabulary','completeness vocabulary','ADT declaration','ADT construction','actual return type proof','exact canonical delegate proof','scanner call graph','semantic field lineage, mapping, and loss','symbol-resolved semantic dataflow','semantic dimension coverage','model hierarchy/elevation proof','source-family coverage','provenance','origin rescans','pipeline rescans','nested rescans','high-level model connection','manifest producer chain','competing vocabularies','semantic fallback/free data']},sourceEvidence:{project:'examples/ecommerce-shop-source',phpFiles:phpFiles.length,syntaxFailures:syntaxFailures.length,internalPhpAst,phpAstUsage,sourceCoverage},coverage:{expectedCategories:expected,sourceAstsPresent:sourceAstProps,sourceAstsMissing:missingCategories,sourceAstsUnexpected:extraCategories,completenessMissing},ast:{declarations:astDecls,construction,returnTypeMismatches,delegateMismatches},semanticLoss:fieldLoss,semanticFlow:{edges:semanticFlow,byNode:semanticFlowByNode,dimensions:dimensionEvidence},modelHierarchy:{highestModel:'CompleteLaravelSourceModel',usages:highModelUsages,catalogFields:highCatalogFields,catalogMissing:highCatalogMissing,sourceCategoryGap:highModelCoverageGap,directSourceAstsConstruction,semanticDuplication},rescans:{allProjectRootScannerCalls:projectRootScannerCalls,hiddenRescans,pipelineRescans,scannerCallGraph,semanticReopenEdges},manifest:{producerBoundary:manifestProof,references:manifestRefs},highLevel:{semanticNodes:highLevelRefs,connectionEvidence:highModelDataflowEvidence,strongConnectionEvidence:strongHighModelEvidence,valueProducerEvidence:highLevelValueProducerEvidence,connectionStatus:highLevelConnectionStatus},vocabulary:{nullabilityFiles},freeData,findings,elevation:{stages:elevationStages,matrix:elevationMatrix,semanticTypeTransforms,semanticProducerSites},astBoundary:{violations:astBoundaryViolations,intermediateDescriptors:intermediateDescriptorFindings,sourceDatumLineage,parserBoundaryGuidance,interfaceOwnershipGuidance,astConsumerContract},sourceConstructCoverage,sourceConstructTrace,astDatumRepairGuidance,interfaceRepairGuidance,sourceBackedDatumGuidance,v61ModelAstBoundary,v61ModelDatumTrace,v61Repairability,modelDatumLineage,concreteFieldLineage,interfaceChangeCandidates,interfaceChangeAuthorization,laravelModelEvidence,firstLossBoundary,modelDatumDataflow,routeOwnerEvidence,modelDataflowEdges,freeDataClassification,semanticFreeData,modelDatumOwnerMap,modelDatumDefaultOrigin,nestedSemanticOwnership,highLevelProjectionGap,highLevelProjectionRepair,modelPropertyAstProducerProof,modelPropertyAstBoundaryStatus,modelHighLevelConnectionProof,upstreamRepairPlan,modelElevationDecision,modelElevationTargets,modelElevationFindings,summary:{critical,high,unproven,hiddenRescans:hiddenRescans.length,pipelineRescans:pipelineRescans.length,nestedProjectRootRescans:findings.filter(x=>x.kind==='nested_project_root_rescan').length,semanticFieldLoss:findings.filter(x=>x.kind==='semantic_field_loss_risk' && highLevelProductionFlowConnected).length,semanticFieldMappingUnproven:findings.filter(x=>x.kind==='semantic_field_mapping_unproven').length,semanticLineageUnproven:findings.filter(x=>x.kind==='semantic_lineage_unproven').length,returnTypeMismatches:returnTypeMismatches.length,delegateMismatches:delegateMismatches.length,scannerGraphEdges:scannerCallGraph.length,semanticReopenEdges:semanticReopenEdges.length,freeData:freeData.length,semanticFreeData:semanticFreeData.length,strongHighModelEvidence:strongHighModelEvidence.length,actualProductionFlow,highLevelProductionFlowConnected,highLevelProjectionStatus,highLevelProductionFlowEvidence:highLevelProductionFlowEvidence.length,highLevelValueProducerEvidence:highLevelValueProducerEvidence.length,completeModelValueProducerEvidence:completeModelValueProducerEvidence.length,completeModelConnected,completeModelProducerStatus,highLevelConnectionStatus,v61AstTraceable:v61ModelDatumTrace.filter(x=>x.status==='SOURCE_TO_AST_TO_EXISTING_SEMANTIC_OWNER_PROVEN').length,v61DefaultOrigin:v61ModelDatumTrace.filter(x=>x.status==='NO_EXPLICIT_SOURCE_PROPERTY').length,firstLossBoundary:firstLossBoundary.map(x=>({datum:x.datum,firstLoss:x.firstLoss,repairTarget:x.repairTarget}))},repairOrder:['1. Establish/verify repository PHP AST producer and its consumption from ecommerce-shop source.','2. Complete SourceAsts + completeness vocabulary, including channels.','3. Remove every non-origin projectRoot rescan and hidden double scan.','4. Prove actual return types and exact delegate behavior of *Ast producers; reject legacy descriptor widening.',
    '4a. Remove canonical methods that delegate to legacy scanners; connect their existing canonical builders directly.',
    '5. Connect existing high-level semantic nodes at the origin boundary.','6. Repair semantic field loss at the first proven loss location in the existing upstream model/AST boundary.','7. Prove canonical AST constructors and provenance.','8. Prove SourceAsts -> CompleteSourceAst -> RouteSyncManifest.','9. Remove semantic fallback/Record only after upstream meaning is present.','10. Re-run on fresh ecommerce-shop source; legacy manifest remains rejected.','11. Use interfaceRepairGuidance as the change plan; never create a parallel interface from an UNPROVEN finding.','12. Treat nested facts as semantic ownership, not as a reason to add duplicate top-level fields.','13. Authorize interface changes only from concrete field-level source/producers; declaration shape alone is insufficient.','14. Preserve proven semantic datums through the existing owner before considering any interface enrichment.','15. Every semantic scanner must consume the existing PHP AST/ADT boundary; token-only semantic extraction is a repair finding.','16. Existing intermediate descriptors must be traced and collapsed only after field lineage is proven; never replace them with another free interface.','17. Every source datum must have a proven PHP AST/ADT origin before its semantic producer is treated as authoritative.','18. When the existing owner is proven, repair the producer boundary first; do not widen the interface merely because a token-level parser is incomplete.','19. A token-only semantic extractor is a boundary defect, not an AST lineage proof.','20. Before changing any semantic interface, prove the source construct exists in the canonical PHP AST/ADT vocabulary. If the ADT cannot represent it, repair the ADT boundary first.','21. Interface-change authorization is fail-closed: source evidence alone never authorizes a new field; source -> ADT -> producer -> owner -> canonical AST lineage is required.','22. Inventory actual Laravel constructs before classifying AST coverage; distinguish generic ADT, specialized ADT, token-only, and missing representation.','23. Specialized AST coverage is not permission to create a generic interface; trace the existing scoped owner first.','24. Report the first-loss boundary per source datum, not only aggregate counts.','25. Treat an existing semantic owner as evidence of ownership, never as proof of source lineage.','26. Keep structural data containers separate from semantic free data; only semantic free data is a repair blocker.','27. Build an explicit existing-symbol dataflow graph before recommending interface changes.','28. Source evidence counts must be derived from escaped literal property names, never hand-built regex escapes.','29. Map source datums to nested existing semantic owners before classifying high-level interface fields as missing.','30. Prefer literal source evidence for property existence; regex is unnecessary when matching exact PHP property tokens.','31. Distinguish explicit Laravel source values from framework/default semantic values.','32. Compare CompleteLaravelSourceModel against SourceAsts as a producer-backed projection; missing catalog categories are not free interface fields.','33. Distinguish lexer-to-AST construction from semantic token bypass: tokens may construct ADT nodes, but semantic owners must consume those ADT nodes.','34. After repairing an ADT boundary, recompute first-loss; never report the repaired boundary as the active blocker.','35. If ModelFacts is proven but ModelSemanticNode/CompleteLaravelSourceModel has no producer usage, report the high-level connection as the next blocker.','36. A high-level type reference never proves dataflow; require value-level producer/consumer evidence.','37. Distinguish semantic Records/index signatures from structural containers.','38. Recompute model dataflow after every AST boundary repair; never keep a stale hardcoded edge path.']};

// V64. Model-elevation transaction: turn a recommendation into a source-backed,
// verifiable change contract. This is intentionally fail-closed: it does not mutate
// production code unless an existing owner, insertion boundary, producer and consumer
// are all proven. It records the exact elevation needed so a later repair can be applied
// and then traced again against the same invariants.
function symbolText(file, symbol){
  const source=read(file);
  const re=new RegExp(`(?:export\\s+)?(?:async\\s+)?(?:function|class|interface|type)\\s+${symbol}\\b`);
  return re.test(source);
}

const elevationTransactions=[];
const semanticProjectionFile='packages/core/src/types/upstream/highLevelSourceModel.ts';
const sourceAstFile='packages/core/src/compiler/scanner/orchestrator/sourceAstScanner.ts';
const modelAstFile='packages/core/src/types/upstream/ast.ts';
const modelFactsFile='packages/core/src/types/upstream/modelSourceFacts.ts';

const modelProjectionProducer = {
  owner:'ModelSemanticNode',
  producer:'modelSemanticNodeFromAst',
  file:semanticProjectionFile,
  input:'ModelAst',
  output:'ModelSemanticNode',
  proven: symbolText(semanticProjectionFile,'modelSemanticNodeFromAst') &&
    /facts:\s*ast\.facts/.test(read(semanticProjectionFile)) &&
    /source:\s*ast\.source/.test(read(semanticProjectionFile))
};

const modelSourceProducer = {
  owner:'ModelAst',
  producer:'ModelScanner.scanAsts',
  file:'packages/core/src/compiler/scanner/subscanners/ModelScanner.ts',
  consumer:'scanSourceAsts',
  consumerFile:sourceAstFile,
  proven:/export async function scanModelAsts\(/.test(read('packages/core/src/compiler/scanner/subscanners/ModelScanner.ts')) &&
    /ModelScanner\.scanAsts\(projectRoot\)/.test(read(sourceAstFile))
};

const highLevelCatalog = {
  owner:'CompleteLaravelSourceModel',
  file:semanticProjectionFile,
  shapeProven:/export type CompleteLaravelSourceModel/.test(read(semanticProjectionFile)),
  producerProven:false,
  consumerProven:false
};

const exactElevation = {
  kind:'model_elevation_transaction',
  status:modelProjectionProducer.proven && modelSourceProducer.proven ? 'READY_FOR_EXISTING_BOUNDARY_REPAIR' : 'BLOCKED',
  level:'ModelAst -> ModelSemanticNode',
  source:{file:modelAstFile,symbol:'ModelAst'},
  producer:modelSourceProducer,
  target:modelProjectionProducer,
  nextOwner:highLevelCatalog,
  action:modelProjectionProducer.proven
    ? 'Connect the existing modelSemanticNodeFromAst(ModelAst) projection at the canonical upstream boundary. Do not change ModelSemanticNode shape. After connection, materialize the existing catalog owner and trace value lineage before changing CompleteLaravelSourceModel.'
    : 'First establish the existing ModelAst -> ModelSemanticNode producer; do not invent a new semantic interface.',
  verification:[
    'Every scanned ModelAst has a corresponding ModelSemanticNode value.',
    'ModelSemanticNode.facts is the exact ModelAst.facts object; no semantic reconstruction occurs downstream.',
    'ModelSemanticNode.source is the exact ModelAst.source provenance.',
    'The projection is produced once at the canonical upstream boundary.',
    'The next trace proves whether CompleteLaravelSourceModel is a real value owner or remains an orphaned declaration.'
  ],
  forbidden:[
    'new parallel ModelSemanticNode interface',
    'copying ModelFacts fields into duplicate top-level fields',
    'regex reclassification after the projection',
    'cast-based connection',
    'declaring the type as proof of value flow'
  ]
};
elevationTransactions.push(exactElevation);

// A transaction is authorized only when the existing producer and source consumer are
// both proven. The actual mutation is deliberately separate from analysis so the tool
// cannot silently alter production while investigating an unproven lineage.
const elevationExecution = {
  mode:'PLAN_ONLY',
  authorized:elevationTransactions.every(x=>x.status==='READY_FOR_EXISTING_BOUNDARY_REPAIR'),
  mutationApplied:false,
  postRepairTraceRequired:true,
  transactions:elevationTransactions,
  invariant:'No production mutation is performed by the trace pass; apply only the exact transaction after human/repair-stage approval, then rerun the trace on fresh source.'
};

report.modelElevationExecution=elevationExecution;
report.schema='routesync.data-loss-trace/v64';


// V65: elevate the repair engine from advice-only to a source-backed, closed-loop
// repair transaction. It never mutates production unless an exact existing owner,
// insertion boundary, and post-condition are all proven by the trace itself.
const sourceAstSource = read(sourceAstFile);
const projectionSource = read(semanticProjectionFile);
const canonicalModelCall = 'ModelScanner.scanAsts(projectRoot)';
const projectionSymbol = 'modelSemanticNodeFromAst';
const projectionCallCount = (sourceAstSource.match(new RegExp(projectionSymbol, 'g')) || []).length;
const modelAstCallCount = (sourceAstSource.match(new RegExp(canonicalModelCall.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')) || []).length;
const projectionImported = new RegExp(`\\b${projectionSymbol}\\b`).test(sourceAstSource);
const projectionExported = /export function modelSemanticNodeFromAst\(ast: ModelAst\)/.test(projectionSource);
const modelBoundaryAnchor = /const models: readonly ModelAst\[\] = await ModelScanner\.scanAsts\(projectRoot\);/.test(sourceAstSource);
const sourceAstsReturnAnchor = /return \{\s*kind: "source_asts"/.test(sourceAstSource);

const elevationRepairTransaction = {
  kind:'existing_model_elevation_repair',
  id:'MODEL_AST_TO_SEMANTIC_NODE',
  level:'ModelAst -> ModelSemanticNode',
  status: projectionExported && modelBoundaryAnchor && !projectionImported
    ? 'REPAIR_CANDIDATE_EXACT_BOUNDARY'
    : projectionImported
      ? 'ALREADY_CONNECTED_OR_PARTIALLY_CONNECTED'
      : 'BLOCKED',
  source:{
    file:modelAstFile,
    owner:'ModelAst',
    producer:'ModelScanner.scanAsts',
    call:canonicalModelCall
  },
  target:{
    file:semanticProjectionFile,
    owner:'ModelSemanticNode',
    producer:projectionSymbol
  },
  boundary:{
    file:sourceAstFile,
    anchor:'after canonical ModelScanner.scanAsts(projectRoot) result',
    anchorProven:modelBoundaryAnchor,
    returnBoundaryProven:sourceAstsReturnAnchor
  },
  mutation:{
    type:'CONNECT_EXISTING_PRODUCER',
    forbidden:['new interface','new semantic fields','copy ModelFacts fields','cast','regex reconstruction'],
    exactIntent:'materialize the existing ModelSemanticNode projection once at the canonical upstream boundary; preserve ast.facts and ast.source by reference.',
    notApplied:true
  },
  preconditions:[
    'ModelScanner.scanAsts(projectRoot) is the canonical ModelAst producer.',
    'modelSemanticNodeFromAst(ModelAst) already exists and is exported.',
    'No existing projection call is already connected at the canonical boundary.',
    'The canonical SourceAsts return remains the downstream owner.'
  ],
  postconditions:[
    'Every ModelAst has exactly one corresponding ModelSemanticNode.',
    'ModelSemanticNode.facts === ModelAst.facts by lineage, not reconstructed values.',
    'ModelSemanticNode.source === ModelAst.source by lineage.',
    'The projection occurs once at the origin boundary.',
    'A fresh trace reports the new edge as PROVEN and moves the next unresolved boundary forward.'
  ],
  rollback:'Remove only the newly introduced projection connection; do not alter ModelAst, ModelFacts, or ModelSemanticNode shape.'
};

const closedLoop = {
  mode:'SOURCE_BACKED_REPAIR_ENGINE',
  stages:['TRACE','FIRST_LOSS','MODEL_ELEVATION','EXACT_REPAIR_TRANSACTION','POST_REPAIR_TRACE','VERIFY_OR_ADVANCE'],
  currentStage:elevationRepairTransaction.status==='REPAIR_CANDIDATE_EXACT_BOUNDARY' ? 'EXACT_REPAIR_TRANSACTION' : 'TRACE',
  transaction:elevationRepairTransaction,
  applyPolicy:'FAIL_CLOSED',
  mutationApplied:false,
  nextAction:elevationRepairTransaction.status==='REPAIR_CANDIDATE_EXACT_BOUNDARY'
    ? 'Apply only this exact existing-owner connection, then rerun V65 against fresh ecommerce-shop source. Do not modify interfaces before the post-repair trace.'
    : 'Do not mutate production; continue tracing until an exact existing-owner boundary is proven.',
  verificationRequired:true
};

report.repairEngineV65=closedLoop;
report.schema='routesync.data-loss-trace/v65';
report.toolVersion='v65';
const v65out=abs('data-loss-trace-v69.json');
fs.writeFileSync(v65out,JSON.stringify(report,null,2));
console.log(JSON.stringify({
  schema:'routesync.data-loss-trace/v65',
  repairEngine:closedLoop,
  sourceEvidence:{modelAstCallCount,projectionExported,projectionImported,projectionCallCount,modelBoundaryAnchor,sourceAstsReturnAnchor},
  out:rel(v65out)
},null,2));



// V66: closed-loop model-elevation verifier.
// The repair is applied ONLY to a disposable sandbox copy of the workspace.
// Production files are never mutated by this tool. The sandbox is then traced
// again with V65 so the repair is judged by observed post-repair evidence.
const v66Tool='v69';
const v67VerifyOnly=process.env.ROUTESYNC_V69_VERIFY_ONLY==='1';
const v66SourceAstFile='packages/core/src/compiler/scanner/orchestrator/sourceAstScanner.ts';
const v66ProjectionImport="import { modelSemanticNodeFromAst } from '../../../types/upstream/highLevelSourceModel';";
const v66ProjectionLine='const modelSemanticNodes = models.map(modelSemanticNodeFromAst);';
const v66InsertionAnchor='const modelSymbolTable = new ModelSymbolTable(models);';
const v66Sandbox=path.join(require('os').tmpdir(),`routesync-v67-${process.pid}`);
const v66Copy=(src,dst)=>{
  fs.mkdirSync(path.dirname(dst),{recursive:true});
  fs.cpSync(src,dst,{recursive:true,filter:(source)=>!/(node_modules|dist|\\.git)([\\/]|$)/.test(source)});
};
const v66Apply=(workspace)=>{
  const file=path.join(workspace,v66SourceAstFile);
  let source=fs.readFileSync(file,'utf8');
  if(source.includes(v66ProjectionLine)) return {status:'ALREADY_APPLIED',file};
  const importAnchor='import type { ControllerAst, ModelAst, RequestAst, ResourceAst, RouteAst } from "../../../types/upstream/ast";';
  if(!source.includes(importAnchor)) return {status:'BLOCKED',reason:'canonical AST import anchor not found',file};
  if(!source.includes(v66InsertionAnchor)) return {status:'BLOCKED',reason:'canonical ModelAst boundary anchor not found',file};
  source=source.replace(importAnchor,importAnchor+'\n'+v66ProjectionImport);
  source=source.replace(v66InsertionAnchor,v66InsertionAnchor+'\n    '+v66ProjectionLine);
  fs.writeFileSync(file,source);
  return {status:'APPLIED_IN_SANDBOX',file};
};
const v66FreshRoot=abs('.');
let v66SandboxResult={status:v67VerifyOnly?'VERIFY_ONLY':'NOT_RUN'};
if (!v67VerifyOnly) {
try {
  fs.rmSync(v66Sandbox,{recursive:true,force:true});
  v66Copy(v66FreshRoot,v66Sandbox);
  const pre=fs.readFileSync(path.join(v66Sandbox,v66SourceAstFile),'utf8');
  const preHasProjection=pre.includes(v66ProjectionLine);
  const apply=v66Apply(v66Sandbox);
  const post=fs.readFileSync(path.join(v66Sandbox,v66SourceAstFile),'utf8');
  const postHasImport=post.includes(v66ProjectionImport);
  const postHasProjection=post.includes(v66ProjectionLine);
  const syntax=cp.spawnSync(process.execPath,['--check',path.join(v66Sandbox,'tools/trace-data-loss-v67.cjs')],{encoding:'utf8',timeout:120000});
  let rerun=null;
  if(apply.status==='APPLIED_IN_SANDBOX' && postHasImport && postHasProjection){
    const run=cp.spawnSync(process.execPath,[path.join(v66Sandbox,'tools/trace-data-loss-v67.cjs'),v66Sandbox],{cwd:v66Sandbox,encoding:'utf8',maxBuffer:20*1024*1024,timeout:120000,env:{...process.env,ROUTESYNC_V69_VERIFY_ONLY:'1'}});
    rerun={exitCode:run.status,stdout:run.stdout,stderr:run.stderr};
  }
  let postReport=null;
  const postReportFile=path.join(v66Sandbox,'data-loss-trace-v69.json');
  if(fs.existsSync(postReportFile)) postReport=JSON.parse(fs.readFileSync(postReportFile,'utf8'));
  const postConnected=postReport?.modelHighLevelConnectionProof?.status==='CONNECTED_BY_VALUE_LINEAGE' || postReport?.highLevelConnectionStatus==='VALUE_LINEAGE_EVIDENCE_PRESENT';
  const postFirstLoss=postReport?.rootCauses?.filter(x=>x.status==='PROVEN_FIRST_LOSS').map(x=>({datum:x.firstLoss?.datum||x.firstLoss?.field||null,boundary:x.firstLoss?.boundary||null,owner:x.repairTarget||null}))||[];
  const verified=apply.status==='APPLIED_IN_SANDBOX' && postHasImport && postHasProjection && syntax.status===0 && rerun?.exitCode===0 && postConnected;
  v66SandboxResult={
    mode:'DISPOSABLE_SANDBOX',
    productionMutation:false,
    sandbox:v66Sandbox,
    precondition:{projectionAlreadyConnected:preHasProjection},
    apply,
    syntaxCheck:{exitCode:syntax.status,ok:syntax.status===0,stderr:syntax.stderr},
    postRepairSourceEvidence:{importPresent:postHasImport,projectionCallPresent:postHasProjection},
    postRepairTrace:{exitCode:rerun?.exitCode??null,ok:rerun?.exitCode===0,report:postReport?{schema:postReport.schema,toolVersion:postReport.toolVersion,status:postReport.status,rootCauseSummary:postReport.rootCauseSummary,firstLosses:postFirstLoss}:null},
    verified,
    result:verified?'MODEL_ELEVATION_VERIFIED_IN_SANDBOX':'MODEL_ELEVATION_NOT_VERIFIED',
    nextAction:verified?'Use this verified exact patch as the production repair candidate; production remains untouched.':'Keep production unchanged and continue tracing the unresolved boundary.'
  };
} catch(error) {
  v66SandboxResult={mode:'DISPOSABLE_SANDBOX',productionMutation:false,status:'BLOCKED',error:String(error?.stack||error)};
}
}
report.repairEngineV66={
  mode:'TRACE_SUGGEST_REPAIR_VERIFY',
  stages:['TRACE','FIRST_LOSS','MODEL_ELEVATION','EXACT_REPAIR','POST_REPAIR_TRACE','VERIFY_OR_ADVANCE'],
  productionMutation:false,
  exactMutation:{file:v66SourceAstFile,anchor:v66InsertionAnchor,operation:'CONNECT_EXISTING_MODEL_SEMANTIC_PROJECTION'},
  sandbox:v66SandboxResult,
  invariant:'A repair is considered successful only when the exact existing-owner connection is applied in a disposable workspace and a fresh trace verifies the post-repair state. No production mutation is performed by the trace tool.'
};
report.schema='routesync.data-loss-trace/v69';
report.toolVersion=v66Tool;
const v66out=abs('data-loss-trace-v69.json');
fs.writeFileSync(v66out,JSON.stringify(report,null,2));
console.log(JSON.stringify({schema:report.schema,toolVersion:'v69',repairEngineV66:report.repairEngineV66,out:rel(v66out)},null,2));
try { fs.rmSync(v66Sandbox,{recursive:true,force:true}); } catch {}

// V67 writes only data-loss-trace-v69.json; legacy V64 output is intentionally not overwritten.

console.log(JSON.stringify({out:'data-loss-trace-v69.json',status,phpFiles:phpFiles.length,internalPhpAst,critical,high,unproven,missingCategories,hiddenRescans:hiddenRescans.length,pipelineRescans:pipelineRescans.length,nestedProjectRootRescans:findings.filter(x=>x.kind==='nested_project_root_rescan').length,semanticFieldLoss:findings.filter(x=>x.kind==='semantic_field_loss_risk' && highLevelProductionFlowConnected).length,semanticFieldMappingUnproven:findings.filter(x=>x.kind==='semantic_field_mapping_unproven').length,semanticLineageUnproven:findings.filter(x=>x.kind==='semantic_lineage_unproven').length,returnTypeMismatches:returnTypeMismatches.length,delegateMismatches:delegateMismatches.length,scannerGraphEdges:scannerCallGraph.length,semanticReopenEdges:semanticReopenEdges.length,freeData:freeData.length},null,2));
