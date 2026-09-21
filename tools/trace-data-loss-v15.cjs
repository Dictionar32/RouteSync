#!/usr/bin/env node
/** RouteSync trace v14: precise source-to-ADT lineage, targeted first-loss proof, and high-model boundary audit. */
const fs=require('fs'),path=require('path'),ts=require('typescript');
const repo=path.resolve(process.argv[2]||process.cwd());
const project=path.resolve(process.argv[3]||path.join(repo,'examples/ecommerce-shop-source'));
const out=path.resolve(process.argv[4]||path.join(repo,'data-loss-trace-v12.json'));
const skip=new Set(['node_modules','.git','dist','coverage','.next','test-output','scratch','out_sdk','vendor']);
const rel=p=>path.relative(repo,p).replaceAll('\\','/');
const read=p=>fs.readFileSync(p,'utf8');
const src=r=>path.join(repo,r);
const line=(s,p)=>s.slice(0,p).split('\n').length;
function walk(d,fn){if(!fs.existsSync(d))return;for(const e of fs.readdirSync(d,{withFileTypes:true})){if(skip.has(e.name))continue;const p=path.join(d,e.name);e.isDirectory()?walk(p,fn):fn(p)}}
const tsFiles=[],phpFiles=[];
walk(src('packages/core/src'),p=>{if(/\.(ts|tsx)$/.test(p))tsFiles.push(p)});
walk(src('packages/cli/src'),p=>{if(/\.(ts|tsx)$/.test(p))tsFiles.push(p)});
walk(project,p=>{if(/\.php$/.test(p))phpFiles.push(p)});
const findings=[],add=x=>findings.push(x);
const pipeline=src('packages/core/src/compiler/scanner/orchestrator/pipelineScanner.ts');
const ptext=read(pipeline);
const proof=[
 ['AST_PRODUCER','packages/core/src/compiler/scanner/orchestrator/sourceAstScanner.ts','scanSourceAsts'],
 ['PIPELINE_AST_ASSIGNMENT','packages/core/src/compiler/scanner/orchestrator/pipelineScanner.ts','const sourceAsts'],
 ['SCANNER_RESULT','packages/core/src/compiler/scanner/orchestrator/pipelineScanner.ts','new ScannedRouteManifestDescriptor'],
 ['FACADE','packages/core/src/compiler/scanner/StaticLaravelScanner.ts','executeScanPipeline'],
 ['CLI_INPUT','packages/cli/src/commands/scan.ts','StaticLaravelScanner.scan'],
 ['MANIFEST_TRANSFORM','packages/cli/src/commands/scan.ts','resolveManifestIncrementally'],
 ['MANIFEST_WRITER','packages/cli/src/commands/scan.ts','ManifestGenerator.save']
].map(([stage,file,needle])=>({stage,file,needle,found:fs.existsSync(src(file))&&read(src(file)).includes(needle)}));
for(const x of proof)if(!x.found)add({type:'PRODUCER_CHAIN_GAP',severity:'critical',status:'UNPROVEN',...x});
const sf=ts.createSourceFile(pipeline,ptext,ts.ScriptTarget.Latest,true,ts.ScriptKind.TS);
const calls=[];function visit(n){if(ts.isCallExpression(n))calls.push({callee:n.expression.getText(sf),line:line(ptext,n.getStart(sf)),args:n.arguments.map(a=>a.getText(sf))});ts.forEachChild(n,visit)}visit(sf);
const scannerNames=['ModelScanner.scan','FormRequestScanner.scan','ControllerScanner.scan','ResourceScanner.scan','RouteScanner.scan','ChannelScanner.scan'];
const scannerCalls=calls.filter(x=>scannerNames.includes(x.callee));
const astAssignment= calls.find(x=>x.callee==='scanSourceAsts');
const sourceUses=[];function uses(n){if(ts.isIdentifier(n)&&n.text==='sourceAsts')sourceUses.push({line:line(ptext,n.getStart(sf)),parent:n.parent.kind});ts.forEachChild(n,uses)}uses(sf);
add({type:'SOURCE_AST_SYMBOL_LINEAGE',status:sourceUses.length<=1?'PROVEN_DEAD_AFTER_ASSIGNMENT':'REVIEW',assignment:astAssignment||null,uses:sourceUses,repair:'Pass the existing SourceAsts value into the existing scanner boundary; do not create a second source model.'});
const sourceAstScanner=src('packages/core/src/compiler/scanner/orchestrator/sourceAstScanner.ts');
const astText=read(sourceAstScanner);
const astCategoryProducers=[...astText.matchAll(/\b(?:ModelScanner|FormRequestScanner|ControllerScanner|ResourceScanner|RouteScanner|ControllerScanner)\.(?:scanAsts|scanCanonicalAsts|scan)\s*\(/g)].map(m=>({callee:m[0].replace(/\($/,''),line:line(astText,m.index)}));
const legacyPipelineRescans=scannerCalls.filter(x=>x.args.some(a=>a.includes('projectRoot')));
add({type:'CANONICAL_AST_CATEGORY_PRODUCERS',status:astCategoryProducers.length?'PROVEN':'NOT_FOUND',count:astCategoryProducers.length,locations:astCategoryProducers,rule:'Category producers inside SourceAst construction are expected; they are not themselves data-loss defects.'});
add({type:'LEGACY_SCANNER_RESCAN_AFTER_AST',severity:'critical',status:legacyPipelineRescans.length?'PROVEN':'NOT_FOUND',count:legacyPipelineRescans.length,locations:legacyPipelineRescans,repair:'Consume the existing SourceAsts/ADT at the scanner boundary. Do not rescan projectRoot once the canonical source model exists.'});
const sourceInventory={};for(const f of phpFiles){const r=rel(f),category=r.includes('/app/Models/')?'models':r.includes('/app/Http/Resources/')?'resources':r.includes('/app/Http/Requests/')?'requests':r.includes('/app/Http/Controllers/')?'controllers':r.endsWith('/routes/channels.php')?'channels':r.includes('/routes/')?'routes':r.includes('/database/migrations/')?'migrations':r.includes('/app/Services/')?'services':r.includes('/app/DTOs/')||r.includes('/app/Http/DTOs/')?'dtos':r.includes('/app/Http/Middleware/')?'middlewares':r.includes('/app/Providers/')?'providers':r.includes('/app/Attributes/')?'attributes':r.includes('/routes/channels.php')?'channels':'other';(sourceInventory[category]??=[]).push(r)}
add({type:'LARAVEL_SOURCE_INVENTORY',status:'PROVEN',project:rel(project),counts:Object.fromEntries(Object.entries(sourceInventory).map(([k,v])=>[k,v.length])),files:sourceInventory,rule:'This is source inventory only; it does not prove scanner output.'});
const categoryToAst={models:'models',resources:'resources',requests:'requests',controllers:'controllers',routes:'routes',migrations:'migrations',services:'services',dtos:'dtos',middlewares:'middlewares',providers:'providers',attributes:'attributes'};
const missingAstCategories=Object.keys(categoryToAst).filter(k=>sourceInventory[k]?.length && !astText.includes(`${categoryToAst[k]}:`));
if(missingAstCategories.length)add({type:'SOURCE_CATEGORY_NOT_IN_SOURCE_AST',severity:'high',status:'LOSS_CANDIDATE',categories:missingAstCategories,repair:'Extend the existing SourceAsts ADT only when the source category is truly part of the canonical Laravel model; preserve explicit empty/not_scanned states.'});
const program=ts.createProgram(tsFiles,{target:ts.ScriptTarget.Latest,module:ts.ModuleKind.CommonJS,moduleResolution:ts.ModuleResolutionKind.NodeJs,noEmit:true,skipLibCheck:true,strict:false});
const boundaries=[];const freeData=[];const duplicateVocabulary=[];
const semantic=/nullable|nullability|presence|cardinality|condition|expression|semantic|bound|resource|model|response|source|provenance|type/i;
function audit(n,s){
 if(!(ts.isInterfaceDeclaration(n)||ts.isTypeAliasDeclaration(n)))return;
 const name=n.name?.text||'';if(!/^(Source|Parsed|Scanned|Bound|Semantic|Manifest|Route|Resource|Model|Response|Request|Controller)/.test(name))return;if(!(/\/types\/upstream\//.test(rel(s.fileName))||/\/compiler\/scanner\//.test(rel(s.fileName))))return;
 const text=n.getText(s),fields=ts.isInterfaceDeclaration(n)||ts.isClassDeclaration(n)?n.members.map(m=>m.name?.getText(s)).filter(Boolean):[];
 const relevant=fields.some(x=>semantic.test(x));if(!relevant)return;
 const risks=[];
 if(/\bRecord\s*</.test(text)||/\[\s*key\s*:\s*string\s*\]/.test(text))risks.push('free_record_or_index_signature');
 if(/:\s*any\b/.test(text)||/\bas\s+any\b/.test(text))risks.push('any');
 if(/\bunknown\b/.test(text))risks.push('unknown');
 if(/\?\s*:/.test(text))risks.push('optional_field');
 if(/:\s*null\b|\|\s*null\b/.test(text))risks.push('nullable_as_raw_null');
 const item={file:rel(s.fileName),name,fields,risks};boundaries.push(item);if(risks.length)freeData.push(item);
}
for(const f of tsFiles){const s=program.getSourceFile(f);if(!s)continue;function v(n){audit(n,s);ts.forEachChild(n,v)}v(s)}
for(const f of tsFiles){const t=read(f);if(/export\s+type\s+Nullability\s*=/.test(t))duplicateVocabulary.push({file:rel(f),line:(t.match(/export\s+type\s+Nullability\s*=/)||[]).length?line(t,t.indexOf('export type Nullability')):1})}
if(freeData.length)add({type:'FREE_DATA_BOUNDARY_AUDIT',severity:'high',status:'LOSS_RISK',count:freeData.length,samples:freeData.slice(0,120),repair:'Replace only confirmed free-data boundary fields with existing closed ADTs; do not create parallel vocabulary.'});
if(duplicateVocabulary.length>1)add({type:'DUPLICATE_SEMANTIC_VOCABULARY',severity:'high',status:'PROVEN_DUPLICATE',items:duplicateVocabulary,repair:'Converge Nullability on the existing upstream vocabulary; adapt consumers at the boundary instead of maintaining competing meanings.'});
const manifestFile=src('packages/core/src/compiler/scanner/descriptors/manifest/routeManifestDescriptor.ts');
const manifestText=read(manifestFile);const manifestParams=[];const mSource=ts.createSourceFile(manifestFile,manifestText,ts.ScriptTarget.Latest,true,ts.ScriptKind.TS);
function findCtor(n){if(ts.isInterfaceDeclaration(n)&&n.name.text==='ScannedRouteManifestParams')for(const p of n.members){if(ts.isPropertySignature(p)&&p.name)manifestParams.push(p.name.getText(mSource));}ts.forEachChild(n,findCtor)}findCtor(mSource);
const pipelineManifestCall=calls.find(x=>x.callee==='ScannedRouteManifestDescriptor');
add({type:'MANIFEST_FIELD_BOUNDARY',status:'PROVEN',fields:manifestParams,source:'ScannedRouteManifestParams',repair:'Every field must have a traced producer from Laravel source/AST/ADT; missing fields are repaired at their first upstream loss, not in lowerers.'});
const nullableCalls=[];const splitAuthority=[];const projection=[];const conditionLoss=[];const branchCollapse=[];const fallbackReclassification=[];const targetedTernary=[];
for(const f of tsFiles){const text=read(f),s=program.getSourceFile(f);if(!s)continue;function v(n){
 if(ts.isCallExpression(n)){const c=n.expression.getText(s),args=n.arguments.map(a=>a.getText(s).replace(/\s+/g,' ').slice(0,300));if(/\.isNullable$/.test(c))nullableCalls.push({file:rel(f),line:line(text,n.getStart(s)),callee:c});const nearby=text.slice(Math.max(0,n.getStart(s)-220),Math.min(text.length,n.getEnd(s)+220));if(nearby.includes('resolvedBranch')||nearby.includes("other.kind === 'unknown'"))fallbackReclassification.push({file:rel(f),line:line(text,n.getStart(s)),callee:c});if(/fromExpression$/.test(c)&&args.some(a=>/semanticType/i.test(a))&&args.some(a=>/boundAst|bound/i.test(a)))splitAuthority.push({file:rel(f),line:line(text,n.getStart(s)),args});}
 if(ts.isPropertyAssignment(n)&&n.name.getText(s)==='conditionExpression'){const init=n.initializer.getText(s);if(/\.kind\s*$/.test(init))conditionLoss.push({file:rel(f),line:line(text,n.getStart(s)),expression:init,reason:'condition reduced to discriminator'});}
 if(ts.isFunctionLike(n)&&n.body&&f.includes('/compiler/scanner/')){const params=n.parameters.filter(p=>ts.isIdentifier(p.name));for(const p of params){const pn=p.name.getText(s),input=new Set(),returned=new Set();function q(x){if(ts.isPropertyAccessExpression(x)&&ts.isIdentifier(x.expression)&&x.expression.text===pn)input.add(x.name.text);if(ts.isReturnStatement(x)&&x.expression&&ts.isObjectLiteralExpression(x.expression))for(const prop of x.expression.properties)if(prop.name)returned.add(prop.name.getText(s));ts.forEachChild(x,q)}ts.forEachChild(n.body,q);const dropped=[...input].filter(k=>!returned.has(k));const meaningful=dropped.filter(k=>semantic.test(k));if(meaningful.length)projection.push({file:rel(f),line:line(text,n.getStart(s)),function:n.name?.getText(s)||'<anonymous>',parameter:pn,dropped:meaningful,returned:[...returned]});}}
 if(ts.isFunctionLike(n)&&n.body&&n.name&&n.name.getText(s)==='bindTernaryField'){const body=n.body.getText(s);const bodyStart=n.body.getStart(s);if(body.includes('conditionExpression: value.condition.kind'))targetedTernary.push({file:rel(f),line:line(text,bodyStart),kind:'condition_discriminator',evidence:'conditionExpression: value.condition.kind'});if(/const\s+semanticType\s*=\s*trueBranch\.descriptor\.semantic\.kind/.test(body)&&/falseBranch\.descriptor\.semantic\.type/.test(body))targetedTernary.push({file:rel(f),line:line(text,bodyStart),kind:'branch_type_selection',evidence:'semanticType selects verified truthy branch, else falsy branch'});if(/fromExpression\([\s\S]*trueBranch\.descriptor\.expression/.test(body))targetedTernary.push({file:rel(f),line:line(body,body.indexOf('fromExpression')),kind:'expression_branch_projection',evidence:'descriptor expression projects true branch'});} ts.forEachChild(n,v)}v(s)}
if(conditionLoss.length)add({type:'CONDITION_SEMANTIC_LOSS',severity:'critical',status:'PROVEN_LOSS',locations:conditionLoss,repair:'Carry the complete conditional Expression/ADT and join branch semantics upstream; never reduce condition to condition.kind.'});
if(splitAuthority.length)add({type:'SPLIT_SEMANTIC_AUTHORITY',severity:'high',status:'LOSS_CANDIDATE',count:splitAuthority.length,samples:splitAuthority.slice(0,80),repair:'Use the existing bound semantic node as the authoritative semantic result; eliminate parallel semanticType + boundAst truth sources.'});
if(nullableCalls.length)add({type:'DOWNSTREAM_RECLASSIFICATION',severity:'high',status:'LOSS_CANDIDATE',count:nullableCalls.length,samples:nullableCalls.slice(0,80),repair:'Consume upstream Nullability/Presence ADTs; do not reclassify from SemanticType downstream.'});
if(targetedTernary.length)add({type:'TERNARY_FIRST_LOSS',severity:'critical',status:'PROVEN_LOSS',count:targetedTernary.length,samples:targetedTernary,repair:'Preserve the complete conditional Expression/ADT, join both branch semantics upstream, and make the bound conditional semantic node authoritative for the descriptor.'});
if(fallbackReclassification.length)add({type:'TERNARY_DOWNSTREAM_FALLBACK',severity:'high',status:'LOSS_CANDIDATE',count:fallbackReclassification.length,samples:fallbackReclassification.slice(0,80),repair:'Remove duplicate ternary resolution and consume the upstream bound conditional semantic result.'});
if(projection.length)add({type:'UPSTREAM_FIELD_PROJECTION',severity:'high',status:'CANDIDATES_FOUND',count:projection.length,samples:projection.slice(0,120),repair:'For each candidate, compare against the declared return type. Repair only when the field is semantically required and absent from the output ADT.'});
const report={schema:'routesync.data-loss-trace/v15',status:!proof.every(x=>x.found)?'UNPROVEN':legacyPipelineRescans.length?'LEGACY_SCANNER_RESCAN_AFTER_AST':conditionLoss.length||targetedTernary.length?'PROVEN_LOSS':sourceUses.length<=1?'SOURCE_AST_DEAD_AFTER_ASSIGNMENT':'LINEAGE_REVIEW',target:{repo,project,tsFiles:tsFiles.length,phpFiles:phpFiles.length},producerChain:proof,findings,boundaryInventory:{count:boundaries.length,samples:boundaries.slice(0,180)},metrics:{phpFiles:phpFiles.length,sourceAstUses:sourceUses.length,canonicalAstCategoryProducers:astCategoryProducers.length,legacyPipelineRescans:legacyPipelineRescans.length,freeDataBoundaries:freeData.length,duplicateNullability:duplicateVocabulary.length,nullableCalls:nullableCalls.length,splitSemanticAuthority:splitAuthority.length,projectionCandidates:projection.length,conditionLoss:conditionLoss.length,branchCollapse:branchCollapse.length,targetedTernary:targetedTernary.length,fallbackReclassification:fallbackReclassification.length,manifestFields:manifestParams.length},repairOrder:[
 {order:1,action:'Make the existing SourceAsts/CompleteSourceAst the origin-boundary input to existing scanners; eliminate the remaining legacy projectRoot rescans.'},
 {order:2,action:'Trace each Laravel source category into the existing SourceAsts ADT and preserve explicit completeness/not-scanned states.'},
 {order:3,action:'Trace SourceAsts/ADT fields into existing Scanned* descriptors and ScannedRouteManifestParams; repair first missing field upstream.'},
 {order:4,action:'Unify duplicate semantic vocabulary using existing upstream ADTs; do not create parallel interfaces.'},
 {order:5,action:'Repair confirmed conditional/nullable semantic losses at bind/source boundaries, then re-run the same trace.'},
 {order:6,action:'Only after a fresh scan is produced from the repaired path may the new manifest be used as evidence; legacy routesync.manifest*.json remains rejected.'}
]};
fs.writeFileSync(out,JSON.stringify(report,null,2));
console.log(JSON.stringify({out,status:report.status,chain:proof.map(x=>[x.stage,x.found]),phpFiles:phpFiles.length,sourceAstUses:sourceUses.length,canonicalAstCategoryProducers:astCategoryProducers.length,legacyPipelineRescans:legacyPipelineRescans.length,freeDataBoundaries:freeData.length,duplicateNullability:duplicateVocabulary.length,nullableCalls:nullableCalls.length,splitSemanticAuthority:splitAuthority.length,projectionCandidates:projection.length,conditionLoss:conditionLoss.length,branchCollapse:branchCollapse.length,targetedTernary:targetedTernary.length,fallbackReclassification:fallbackReclassification.length,manifestFields:manifestParams.length},null,2));
