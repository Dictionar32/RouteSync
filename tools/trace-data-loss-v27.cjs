#!/usr/bin/env node
'use strict';
const fs=require('fs');
const path=require('path');
const cp=require('child_process');
const ts=require('typescript');

const root=path.resolve(process.argv[2]||process.cwd());
const abs=p=>path.join(root,p);
const exists=p=>fs.existsSync(abs(p));
const read=p=>exists(p)?fs.readFileSync(abs(p),'utf8'):'';
const rel=p=>path.relative(root,p).replaceAll(path.sep,'/');
const walk=(dir,out=[])=>{if(!fs.existsSync(dir))return out;for(const e of fs.readdirSync(dir,{withFileTypes:true})){if(['node_modules','dist','.git'].includes(e.name))continue;const p=path.join(dir,e.name);e.isDirectory()?walk(p,out):out.push(p)}return out};
const tsFiles=walk(abs('packages/core/src')).filter(f=>f.endsWith('.ts'));
const scannerFiles=tsFiles.filter(f=>/compiler\/scanner\//.test(rel(f)));
const parse=f=>ts.createSourceFile(f,fs.readFileSync(f,'utf8'),ts.ScriptTarget.Latest,true,ts.ScriptKind.TS);
const line=(sf,n)=>sf.getLineAndCharacterOfPosition(n.getStart(sf)).line+1;
const calls=(file)=>{const sf=parse(file),out=[];function visit(n){if(ts.isCallExpression(n)){out.push({callee:n.expression.getText(sf),line:line(sf,n),args:n.arguments.map(a=>a.getText(sf))})}ts.forEachChild(n,visit)}visit(sf);return out};
const add=(findings,severity,kind,detail,repair)=>findings.push({severity,kind,detail,repair});
const findings=[];

const expected=['models','resources','requests','routes','controllers','services','migrations','responses','dtos','middlewares','providers','attributes','channels'];
const scannerNames=['ModelScanner','FormRequestScanner','ControllerScanner','ResourceScanner','RouteScanner','ChannelScanner'];

// 1. Actual SourceAsts vocabulary.
const collectionsFile=abs('packages/core/src/types/upstream/collections.ts');
let sourceAstProps=[];
if(exists('packages/core/src/types/upstream/collections.ts')){
  const sf=parse(collectionsFile);
  function visit(n){
    if(ts.isTypeAliasDeclaration(n)&&n.name.text==='SourceAsts'&&ts.isTypeLiteralNode(n.type)){
      sourceAstProps=n.type.members.filter(ts.isPropertySignature).map(m=>m.name.getText(sf).replace(/^['"]|['"]$/g,''));
    }
    ts.forEachChild(n,visit);
  }
  visit(sf);
} else add(findings,'critical','workspace_model_missing','SourceAsts declaration is missing.','Restore the existing upstream SourceAsts model before scanner changes.');
const missingCategories=expected.filter(x=>!sourceAstProps.includes(x));
const extraCategories=sourceAstProps.filter(x=>!expected.includes(x));
if(missingCategories.length)add(findings,'critical','source_asts_category_gap',{missing:missingCategories,present:sourceAstProps},'Make the existing SourceAsts vocabulary complete before downstream interpretation.');
if(extraCategories.length)add(findings,'high','source_asts_unexpected_category',{extra:extraCategories},'Align the trace vocabulary with the canonical SourceAsts ADT.');

// 2. Completeness must exactly cover SourceAsts categories and must not treat empty discovery as missing proof.
const compText=read('packages/core/src/types/upstream/completeness.ts');
const compKinds=[...compText.matchAll(/kind:\s*['"]([a-z_]+)['"]/g)].map(m=>m[1]);
const expectedSingular=expected.map(x=>x.endsWith('ies')?x.slice(0,-3)+'y':x.endsWith('s')?x.slice(0,-1):x);
const completenessMissing=expectedSingular.filter(x=>!compKinds.includes(x));
if(completenessMissing.length)add(findings,'critical','completeness_category_gap',{missing:completenessMissing},'Add every SourceAsts category to the existing completeness ADT and validator.');
if(/scanned:\s*\(\): Check => \(\{ kind: ['"]valid['"]/.test(compText)&&/discovered_empty/.test(compText)===false)add(findings,'high','completeness_empty_proof_unchecked','Completeness checker does not visibly distinguish discovered_empty from discovered_many.','Fail closed when a category was scanned but produced no semantic evidence; represent the reason explicitly in the existing ADT.');

// 3. AST declaration shape: source provenance and high-level definition/facts payloads.
const astFile=abs('packages/core/src/types/upstream/ast.ts');
const astDecls=[];
if(exists('packages/core/src/types/upstream/ast.ts')){
  const sf=parse(astFile);
  function visit(n){
    if(ts.isTypeAliasDeclaration(n)&&/Ast$/.test(n.name.text)&&ts.isTypeLiteralNode(n.type)){
      const fields=n.type.members.filter(ts.isPropertySignature).map(m=>({name:m.name?.getText(sf)||'',type:m.type?.getText(sf)||''}));
      const kindField=fields.find(x=>x.name==='kind');
      astDecls.push({type:n.name.text,kind:kindField?.type||null,fields});
    }
    ts.forEachChild(n,visit);
  }
  visit(sf);
}
for(const d of astDecls){
  if(d.type==='CompleteSourceAst')continue;
  if(!d.fields.some(x=>x.name==='source'))add(findings,'critical','ast_without_provenance',{type:d.type},'Every canonical source AST node must retain its source provenance.');
}

// 4. Explicit constructors: object literals must use the declared discriminant. Also detect declared-but-unconstructed ADTs.
const construction=[];
for(const d of astDecls){
  if(d.type==='CompleteSourceAst')continue;
  const hits=[];
  for(const f of scannerFiles){
    const sf=parse(f);
    function visit(n){
      if(ts.isObjectLiteralExpression(n)){
        const k=n.properties.find(p=>ts.isPropertyAssignment(p)&&p.name.getText(sf)==='kind');
        if(k&&d.kind&&k.initializer.getText(sf).replace(/['"]/g,'')===d.kind.replace(/^['"]|['"]$/g,''))hits.push({file:rel(f),line:line(sf,n)});
      }
      ts.forEachChild(n,visit);
    }
    visit(sf);
  }
  construction.push({...d,producers:hits});
  if(!hits.length)add(findings,'critical','adt_construction_unproven',d,'Prove an explicit producer for this canonical ADT or mark the category UNPROVEN.');
}

// 5. All scanner projectRoot reads, not only pipeline/source orchestrators. This catches nested semantic rescans.
const projectRootScannerCalls=[];
for(const f of scannerFiles){
  for(const c of calls(f)){
    const scannerCall=/^(\w+Scanner)\.(scan|scanAsts|scanCanonicalAsts)$/.exec(c.callee);
    if(scannerCall&&c.args.some(a=>a.includes('projectRoot'))){
      const item={file:rel(f),callee:c.callee,line:c.line};
      projectRootScannerCalls.push(item);
      const owner=path.basename(f,'.ts');
      const boundaryFile=/compiler\/scanner\/orchestrator\/(sourceAstScanner|pipelineScanner|upstreamManifestScanner)\.ts$/.test(rel(f));
      if(!boundaryFile) add(findings,'critical','nested_project_root_rescan',item,'Scanner stages must consume canonical upstream data instead of reopening projectRoot.');
    }
  }
}

// 6. Origin boundary double interpretation: sourceAstScanner may call both canonical and legacy scan for same scanner.
const sourceScannerFile=abs('packages/core/src/compiler/scanner/orchestrator/sourceAstScanner.ts');
const sourceCalls=exists('packages/core/src/compiler/scanner/orchestrator/sourceAstScanner.ts')?calls(sourceScannerFile):[];
const hiddenRescans=[];
for(const name of scannerNames){
  const canonical=sourceCalls.filter(x=>x.callee===`${name}.scanAsts`||x.callee===`${name}.scanCanonicalAsts`);
  const legacy=sourceCalls.filter(x=>x.callee===`${name}.scan`);
  if(canonical.length&&legacy.length){
    const item={scanner:name,canonical:canonical.map(x=>x.line),legacy:legacy.map(x=>x.line)};
    hiddenRescans.push(item);add(findings,'critical','hidden_rescan_after_ast',item,'One origin interpretation must produce the authoritative model; do not rescan the same Laravel source through a second API.');
  }
}

// 7. Pipeline semantic rescans.
const pipelineFile=abs('packages/core/src/compiler/scanner/orchestrator/pipelineScanner.ts');
const pipelineCalls=exists('packages/core/src/compiler/scanner/orchestrator/pipelineScanner.ts')?calls(pipelineFile):[];
const pipelineRescans=[];
for(const name of scannerNames){
  const hits=pipelineCalls.filter(x=>x.callee===`${name}.scan`&&x.args.some(a=>a.includes('projectRoot')));
  if(hits.length){const item={scanner:name,lines:hits.map(x=>x.line)};pipelineRescans.push(item);add(findings,'critical','pipeline_rescan_after_ast',item,'The pipeline should consume SourceAsts/high-level upstream models, not re-interpret projectRoot.');}
}

// 8. Manifest producer chain and completeness proof consumption.
const manifestScanner='packages/core/src/compiler/scanner/orchestrator/upstreamManifestScanner.ts';
const manifestText=read(manifestScanner);
const manifestProof={sourceScannerCalls:/scanSourceAsts\s*\(/.test(manifestText),completenessCall:/validateCompleteSourceAst\s*\(/.test(manifestText),returnsRouteSyncManifest:/Promise<RouteSyncManifest>/.test(manifestText)};
if(!manifestProof.sourceScannerCalls||!manifestProof.completenessCall||!manifestProof.returnsRouteSyncManifest)add(findings,'critical','manifest_lineage_gap',manifestProof,'The manifest producer must be an explicit SourceAsts -> completeness proof -> RouteSyncManifest boundary.');
const manifestProducers=[];
for(const f of [...tsFiles,...walk(abs('packages/cli/src')).filter(x=>x.endsWith('.ts'))]){
  const text=fs.readFileSync(f,'utf8');
  if(/ManifestGenerator\.save\s*\(/.test(text)||/scanRouteSyncManifest\s*\(/.test(text))manifestProducers.push({file:rel(f),save:/ManifestGenerator\.save\s*\(/.test(text),scan:/scanRouteSyncManifest\s*\(/.test(text)});
}
if(!manifestProducers.some(x=>x.scan))add(findings,'critical','manifest_scan_producer_unproven','No executable consumer/producer reference to scanRouteSyncManifest was found outside its declaration.','Trace the canonical manifest producer from the scanner boundary.');

// 9. Provenance model: source span/file is structural, but verify the canonical source span type exists and is consumed by AST nodes.
const prov=read('packages/core/src/types/upstream/provenance.ts');
if(!/export type SourceSpan/.test(prov))add(findings,'critical','provenance_model_missing','SourceSpan is not declared in the canonical upstream provenance module.','Restore canonical source provenance instead of adding ad-hoc file/path fields.');

// 10. High-level semantic model coverage. Detect semantic nodes that exist but are not referenced by the source AST scanner.
const hl=read('packages/core/src/types/upstream/highLevelSourceModel.ts');
const semanticNodes=[...hl.matchAll(/export type (\w+SemanticNode)\s*=\s*\{/g)].map(m=>m[1]);
const hlRefs=semanticNodes.map(n=>({type:n,referenced:sourceCalls.some(x=>x.callee.includes(n))||new RegExp(`\\b${n}\\b`).test(read('packages/core/src/compiler/scanner/orchestrator/sourceAstScanner.ts'))}));
for(const x of hlRefs)if(!x.referenced)add(findings,'high','high_level_model_unconnected',x,'Connect the existing high-level semantic model at the origin boundary; do not create a parallel interface.');

// 11. Competing semantic vocabularies.
const nullabilityFiles=tsFiles.filter(f=>/export type Nullability\s*=/.test(fs.readFileSync(f,'utf8'))).map(rel);
if(nullabilityFiles.length>1)add(findings,'high','competing_nullability_vocabulary',{files:nullabilityFiles},'Keep one canonical Nullability vocabulary and make all upstream/domain models use it.');

// 12. Free semantic data / fallback patterns. Restore v25 coverage and keep semantic fallback distinct from parser optional access.
const freeData=[];
for(const f of tsFiles){
  const text=fs.readFileSync(f,'utf8');
  const isStructured=/types\/upstream|compiler\/scanner|compiler\/passes/.test(rel(f));
  if(isStructured){
    const lines=text.split('\n');
    lines.forEach((s,i)=>{
      if(/\bRecord\s*</.test(s))freeData.push({kind:'record',file:rel(f),line:i+1,evidence:s.trim()});
      if(/semanticType|primKind|responseType|resourceType|modelType|requestType|schemaType/.test(s)&&/\?\?|\|\|/.test(s))freeData.push({kind:'semantic_fallback',file:rel(f),line:i+1,evidence:s.trim()});
    });
  }
}
if(freeData.length)add(findings,'high','free_semantic_data',freeData,'Replace free semantic maps/defaults with the existing explicit ADTs/value objects at the origin boundary.');

// 13. Source inventory + PHP tokenizer evidence. php-ast is preferred; tokenizer is only structural evidence and therefore cannot prove a PHP AST.
const phpFiles=walk(abs('examples/ecommerce-shop-source')).filter(f=>f.endsWith('.php'));
let phpAstExtension=false;try{phpAstExtension=cp.execFileSync('php',['-r','echo extension_loaded("ast") ? "yes" : "no";'],{encoding:'utf8'}).trim()==='yes';}catch{}
let syntaxFailures=[];let tokenStats={files:0,classes:0,functions:0};
for(const f of phpFiles){
  try{cp.execFileSync('php',['-l',f],{stdio:['ignore','pipe','pipe']});}catch(e){syntaxFailures.push(rel(f));}
  try{
    const out=cp.execFileSync('php',['-r',`$c=file_get_contents($argv[1]);$t=token_get_all($c);$cl=0;$fn=0;foreach($t as $x){if(is_array($x)){if($x[0]===T_CLASS)$cl++;if($x[0]===T_FUNCTION)$fn++;}}echo $cl." ".$fn;`,f],{encoding:'utf8'}).trim().split(/\s+/).map(Number);
    tokenStats.files++;tokenStats.classes+=out[0]||0;tokenStats.functions+=out[1]||0;
  }catch{}
}
if(syntaxFailures.length)add(findings,'critical','php_source_syntax_failure',{count:syntaxFailures.length,files:syntaxFailures.slice(0,20)},'Fix source syntax before treating scanner lineage as trustworthy.');
if(!phpAstExtension)add(findings,'critical','php_ast_unproven',{phpAstExtension:false,tokenizerAvailable:true},'The environment has PHP tokenizer but no php-ast extension; source AST lineage remains UNPROVEN until the Laravel parser/AST producer emits canonical ADTs.');

// 14. Legacy manifest must never be used as source evidence.
const legacyRefs=[];
for(const f of tsFiles){const text=fs.readFileSync(f,'utf8');if(/routesync\.manifest\.json|manifest\.json/.test(text))legacyRefs.push(rel(f));}
if(legacyRefs.length)add(findings,'critical','legacy_manifest_reference',legacyRefs,'Use fresh Laravel source AST/ADT evidence only; legacy manifest data cannot prove the new upstream model.');

// 15. Status is fail-closed: unresolved proof gaps become UNPROVEN, not REVIEW.
const critical=findings.filter(x=>x.severity==='critical').length;
const high=findings.filter(x=>x.severity==='high').length;
const unprovenKinds=new Set(['adt_construction_unproven','php_ast_unproven','manifest_scan_producer_unproven','manifest_lineage_gap']);
const unproven=findings.filter(x=>unprovenKinds.has(x.kind)).length;
const status=unproven?'UNPROVEN':critical?'REPAIR_REQUIRED':high?'REVIEW_REQUIRED':'CLEAN';

const report={
  schema:'routesync.data-loss-trace/v27',
  status,
  target:'Laravel ecommerce-shop -> PHP AST/ADT -> high-level upstream model -> canonical SourceAsts -> CompleteSourceAst -> RouteSyncManifest',
  method:{
    tsParser:'TypeScript Compiler API',
    phpEvidence:phpAstExtension?'php-ast':'php-tokenizer-only',
    failClosed:true,
    legacyManifestRejected:true,
    lineageChecks:['source inventory','PHP syntax','PHP AST capability','ADT declaration','ADT construction','provenance','SourceAsts vocabulary','completeness vocabulary','origin-boundary rescans','pipeline rescans','nested projectRoot rescans','manifest producer chain','high-level semantic model connection','competing vocabularies','free semantic data']
  },
  sourceEvidence:{project:'examples/ecommerce-shop-source',phpFiles:phpFiles.length,syntaxFailures:syntaxFailures.length,phpAstExtension,tokenStats,legacyManifestRejected:true},
  coverage:{expectedCategories:expected,sourceAstsPresent:sourceAstProps,sourceAstsMissing:missingCategories,sourceAstsUnexpected:extraCategories,completenessMissing},
  ast:{declarations:astDecls,construction},
  rescans:{allProjectRootScannerCalls:projectRootScannerCalls,hiddenRescans,pipelineRescans},
  manifest:{producerBoundary:manifestProof,producers:manifestProducers},
  highLevel:{semanticNodes:hlRefs},
  vocabulary:{nullabilityFiles},
  freeData,
  findings,
  summary:{critical,high,unproven,hiddenRescans:hiddenRescans.length,pipelineRescans:pipelineRescans.length,nestedProjectRootRescans:findings.filter(x=>x.kind==='nested_project_root_rescan').length,freeData:freeData.length},
  repairOrder:[
    '1. Establish PHP AST/ADT producer evidence; tokenizer is not AST proof.',
    '2. Complete the canonical SourceAsts/category vocabulary and completeness validator.',
    '3. Remove origin-boundary double scans and every nested projectRoot semantic rescan.',
    '4. Prove every canonical AST constructor and provenance field.',
    '5. Connect existing high-level semantic models without creating parallel interfaces.',
    '6. Prove SourceAsts -> CompleteSourceAst -> RouteSyncManifest producer lineage.',
    '7. Remove semantic fallback/free Record data only after the upstream model carries the required meaning.',
    '8. Re-run against fresh ecommerce-shop source; never legacy manifest evidence.'
  ]
};
const out=abs('data-loss-trace-v27.json');fs.writeFileSync(out,JSON.stringify(report,null,2));
console.log(JSON.stringify({out:rel(out),status,phpFiles:phpFiles.length,phpAstExtension,critical,high,unproven,missingCategories,hiddenRescans:hiddenRescans.length,pipelineRescans:pipelineRescans.length,nestedProjectRootRescans:findings.filter(x=>x.kind==='nested_project_root_rescan').length,freeData:freeData.length},null,2));
