#!/usr/bin/env node
/** RouteSync trace v10: lineage-aware producer proof, field projection, and first-loss candidates. */
const fs=require('fs'),path=require('path'),ts=require('typescript');
const repo=path.resolve(process.argv[2]||process.cwd()),project=path.resolve(process.argv[3]||path.join(repo,'examples/ecommerce-shop-source')),out=path.resolve(process.argv[4]||path.join(repo,'data-loss-trace-v10.json'));
const skip=new Set(['node_modules','.git','dist','coverage','.next','test-output','scratch','out_sdk']);
const files=[]; function walk(d){if(!fs.existsSync(d))return;for(const e of fs.readdirSync(d,{withFileTypes:true})){if(skip.has(e.name))continue;const p=path.join(d,e.name);e.isDirectory()?walk(p):/\.(ts|tsx)$/.test(e.name)&&files.push(p)}}
walk(path.join(repo,'packages/core/src'));walk(path.join(repo,'packages/cli/src'));
const rel=p=>path.relative(repo,p).replaceAll('\\','/'),read=p=>fs.readFileSync(p,'utf8'),src=r=>path.join(repo,r),line=(s,p)=>s.slice(0,p).split('\n').length;
const findings=[],add=x=>findings.push(x);
const pipeline=src('packages/core/src/compiler/scanner/orchestrator/pipelineScanner.ts');
const ptext=read(pipeline);
const stages=[
 ['AST_PRODUCER','packages/core/src/compiler/scanner/orchestrator/sourceAstScanner.ts','scanSourceAsts'],
 ['PIPELINE_AST_ASSIGNMENT','packages/core/src/compiler/scanner/orchestrator/pipelineScanner.ts','const sourceAsts'],
 ['SCANNER_RESULT','packages/core/src/compiler/scanner/orchestrator/pipelineScanner.ts','new ScannedRouteManifestDescriptor'],
 ['FACADE','packages/core/src/compiler/scanner/StaticLaravelScanner.ts','executeScanPipeline'],
 ['CLI_INPUT','packages/cli/src/commands/scan.ts','StaticLaravelScanner.scan'],
 ['MANIFEST_TRANSFORM','packages/cli/src/commands/scan.ts','resolveManifestIncrementally'],
 ['MANIFEST_WRITER','packages/cli/src/commands/scan.ts','ManifestGenerator.save']
];
const proof=stages.map(([stage,file,needle])=>({stage,file,needle,found:fs.existsSync(src(file))&&read(src(file)).includes(needle)}));
for(const x of proof)if(!x.found)add({type:'producer_chain_gap',severity:'critical',status:'UNPROVEN',...x});
const scannerCalls=[
 'ModelScanner.scan(projectRoot)','FormRequestScanner.scan(projectRoot, interner)','ControllerScanner.scan(projectRoot, formRequestMap)',
 'ResourceScanner.scan(projectRoot, modelSymbolTable, controllerDataflow)','RouteScanner.scan(projectRoot, formRequests, controllerMap)','ChannelScanner.scan(projectRoot)'
];
const astRefs=(ptext.match(/\bsourceAsts\b/g)||[]).length, scannerRescans=scannerCalls.filter(x=>ptext.includes(x));
const astCallArgs=[];const sf=ts.createSourceFile(pipeline,ptext,ts.ScriptTarget.Latest,true,ts.ScriptKind.TS);
function visit(n){if(ts.isCallExpression(n)&&/^(scanSourceAsts|ModelScanner\.scan|FormRequestScanner\.scan|ControllerScanner\.scan|ResourceScanner\.scan|RouteScanner\.scan|ChannelScanner\.scan)$/.test(n.expression.getText(sf)))astCallArgs.push({callee:n.expression.getText(sf),line:line(ptext,n.getStart(sf)),args:n.arguments.map(a=>a.getText(sf))});ts.forEachChild(n,visit)}visit(sf);
add({type:'SOURCE_AST_PROPAGATION',severity:scannerRescans.length?'critical':'info',status:scannerRescans.length?'SOURCE_AST_NOT_PROPAGATED':'PROPAGATION_REVIEW',sourceAstReferences:astRefs,scannerRescans,callSites:astCallArgs,repair:'Existing SourceAst/ADT must become the input boundary for the existing scanners; remove independent projectRoot rescans.'});
const legacy=[];function jsons(d){if(!fs.existsSync(d))return;for(const e of fs.readdirSync(d,{withFileTypes:true})){if(skip.has(e.name))continue;const p=path.join(d,e.name);e.isDirectory()?jsons(p):/manifest.*\.json$/.test(e.name)&&legacy.push(p)}}jsons(project);
add({type:'LEGACY_MANIFEST_EVIDENCE',status:'LEGACY_EVIDENCE_REJECTED',files:legacy.map(rel),repair:'Legacy manifest files cannot prove the new scanner output.'});
const program=ts.createProgram(files,{target:ts.ScriptTarget.Latest,module:ts.ModuleKind.CommonJS,moduleResolution:ts.ModuleResolutionKind.NodeJs,noEmit:true,skipLibCheck:true,strict:false});
const keyCalls=[];const projectionCandidates=[];const nullableCalls=[];const conditionLoss=[];
function typeName(t){try{return t.getText()}catch{return '<unresolved>'}}
for(const f of files){const text=read(f),source=program.getSourceFile(f);if(!source)continue;function v(n){
 if(ts.isCallExpression(n)){const callee=n.expression.getText(source),args=n.arguments.map(a=>a.getText(source).replace(/\s+/g,' ').slice(0,500));
  if(/resolveManifestIncrementally$/.test(callee)||/ManifestGenerator\.save$/.test(callee))keyCalls.push({file:rel(f),line:line(text,n.getStart(source)),callee,args});
  if(/\.isNullable$/.test(callee))nullableCalls.push({file:rel(f),line:line(text,n.getStart(source)),callee,args});
  if(/fromExpression$/.test(callee)&&args.some(x=>/semanticType/i.test(x))&&args.some(x=>/boundAst|bound/i.test(x)))add({type:'SPLIT_SEMANTIC_AUTHORITY',severity:'high',status:'LOSS_CANDIDATE',file:rel(f),line:line(text,n.getStart(source)),call:callee,args,repair:'Make the existing bound semantic node the single source for semantic type/nullability/presence.'});
 }
 if(ts.isPropertyAccessExpression(n)&&n.name.text==='kind'&&ts.isPropertyAccessExpression(n.expression)&&n.expression.name.text==='conditionExpression')conditionLoss.push({file:rel(f),line:line(text,n.getStart(source)),expression:n.getText(source)});
 if(ts.isFunctionLike(n)&&n.body){const params=n.parameters.filter(p=>ts.isIdentifier(p.name));for(const p of params){const pn=p.name.getText(source),input=new Set(),returned=new Set();function q(x){if(ts.isPropertyAccessExpression(x)&&ts.isIdentifier(x.expression)&&x.expression.text===pn)input.add(x.name.text);if(ts.isReturnStatement(x)&&x.expression&&ts.isObjectLiteralExpression(x.expression))for(const prop of x.expression.properties){if(ts.isPropertyAssignment(prop)||ts.isShorthandPropertyAssignment(prop))returned.add(prop.name.getText(source));}ts.forEachChild(x,q)}ts.forEachChild(n.body,q);const dropped=[...input].filter(k=>!returned.has(k));if(dropped.length&&returned.size)projectionCandidates.push({file:rel(f),line:line(text,n.getStart(source)),function:n.name?.getText(source)||'<anonymous>',parameter:pn,inputFields:[...input],returnedFields:[...returned],droppedFields:dropped});}}
 ts.forEachChild(n,v)}v(source)}
if(conditionLoss.length)add({type:'CONDITION_LOSS',severity:'critical',status:'PROVEN_LOSS',locations:conditionLoss,repair:'Preserve the complete existing conditional AST/ADT; do not reduce conditionExpression to its kind.'});
if(nullableCalls.length)add({type:'DOWNSTREAM_RECLASSIFICATION',severity:'high',status:'LOSS_CANDIDATE',count:nullableCalls.length,samples:nullableCalls.slice(0,100),repair:'Consume the existing Nullability ADT from upstream rather than recomputing nullability downstream.'});
add({type:'FIELD_PROJECTION_TRACE',status:projectionCandidates.length?'CANDIDATES_FOUND':'NO_CANDIDATES',count:projectionCandidates.length,samples:projectionCandidates.slice(0,150),rule:'Candidate only: an observed input field absent from returned object may be intentional projection; confirm against the declared output type before repair.'});
add({type:'MANIFEST_BOUNDARY',status:keyCalls.length?'PROVEN':'UNPROVEN',calls:keyCalls,required:['scanner result','resolveManifestIncrementally','resolvedManifest','ManifestGenerator.save']});
const interfaces=[];function boundary(n,s){if(!ts.isInterfaceDeclaration(n)&&!ts.isTypeAliasDeclaration(n)&&!ts.isClassDeclaration(n))return;const name=n.name?.text||'';if(!/^(SourceAst|Parsed|Scanned|Bound|Semantic|Manifest|Route|Resource|Model|Response)/.test(name))return;const fields=(n.members||[]).filter(m=>m.name).map(m=>m.name.getText(s).replace(/["']/g,''));if(fields.some(x=>/nullable|nullability|presence|cardinality|condition|truthy|falsy|expression|provenance|resourceName|modelName|responseName|typeName/.test(x)))interfaces.push({file:rel(s.fileName),owner:name,fields})}
for(const f of files){const s=program.getSourceFile(f);if(!s)continue;function v(n){boundary(n,s);ts.forEachChild(n,v)}v(s)}
const report={schema:'routesync.data-loss-trace/v10',status:!proof.every(x=>x.found)?'UNPROVEN':scannerRescans.length?'SOURCE_AST_NOT_PROPAGATED':conditionLoss.length?'PROVEN_LOSS':'LINEAGE_REVIEW',target:{repo,project,scannedTsFiles:files.length},producerChain:proof,findings,existingBoundaryInterfaces:interfaces,metrics:{interfaces:interfaces.length,projectionCandidates:projectionCandidates.length,nullableCalls:nullableCalls.length,conditionLoss:conditionLoss.length},repairOrder:[
 {order:1,action:'Repair the existing pipeline boundary so SourceAst/ADT is actually passed into existing scanners.'},
 {order:2,action:'Trace each scanner output field into ScannedRouteManifestDescriptor; strengthen existing interfaces at the first missing field.'},
 {order:3,action:'Trace resolvedManifest field-by-field through resolveManifestIncrementally and ManifestGenerator.save.'},
 {order:4,action:'Repair confirmed semantic losses upstream; do not compensate downstream with nullable checks, fallbacks, or reclassification.'},
 {order:5,action:'Run a fresh ecommerce-shop scan from the repaired producer path; legacy manifest remains rejected as evidence.'}
]};
fs.writeFileSync(out,JSON.stringify(report,null,2));console.log(JSON.stringify({out,status:report.status,chain:proof.map(x=>[x.stage,x.found]),sourceAstRefs:astRefs,scannerRescans:scannerRescans.length,conditionLoss:conditionLoss.length,nullableCalls:nullableCalls.length,projectionCandidates:projectionCandidates.length,interfaces:interfaces.length},null,2));
