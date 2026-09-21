const fs=require('fs'),path=require('path');
const root=process.cwd();
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const rel=p=>path.relative(root,p);
const pipeline=read('packages/core/src/compiler/scanner/orchestrator/pipelineScanner.ts');
const sourceAst=read('packages/core/src/compiler/scanner/orchestrator/sourceAstScanner.ts');
const ast=read('packages/core/src/types/upstream/ast.ts');
const collections=read('packages/core/src/types/upstream/collections.ts');
const source=path.join(root,'examples/ecommerce-shop-source');
function walk(d,out=[]){for(const e of fs.readdirSync(d,{withFileTypes:true})){const p=path.join(d,e.name);if(e.name==='node_modules'||e.name==='dist')continue;if(e.isDirectory())walk(p,out);else out.push(p)}return out}
const php=walk(source).filter(f=>f.endsWith('.php'));
const expected=['models','resources','requests','controllers','routes','channels','services','migrations','responses','dtos','middlewares','providers','attributes'];
const missing=expected.filter(c=>!new RegExp(`\\b${c}:`).test(collections));
const pipelineRescans=['FormRequestScanner','ControllerScanner','ResourceScanner','RouteScanner','ChannelScanner'].map(scanner=>({scanner,lines:[...pipeline.matchAll(new RegExp(`${scanner}\\.scan\\(projectRoot`,'g'))].map(m=>pipeline.slice(0,m.index).split('\n').length)})).filter(x=>x.lines.length);
const astTypeLies=[];
if(/async scanAsts\([\s\S]*?Promise<readonly RouteAst\[\]>/.test(read('packages/core/src/compiler/scanner/subscanners/RouteScanner.ts')) && /const routes = await RouteScanner\.scan\([\s\S]*?return routes;/.test(read('packages/core/src/compiler/scanner/subscanners/RouteScanner.ts'))) astTypeLies.push({file:'packages/core/src/compiler/scanner/subscanners/RouteScanner.ts',kind:'route_ast_type_lie',evidence:'scanAsts() declares RouteAst[] but returns ParsedRoute[] directly',repair:'Introduce an explicit adapter from existing ParsedRoute semantic model to existing RouteAst ADT; never assert the type without constructing the ADT.'});
const sourceAstDouble=[];
if(/ControllerScanner\.scanCanonicalAsts\(projectRoot/.test(sourceAst)&&/ControllerScanner\.scan\(projectRoot/.test(sourceAst))sourceAstDouble.push('controller');
if(/ResourceScanner\.scanAsts\(projectRoot/.test(sourceAst)&&/ResourceScanner\.scan\(projectRoot/.test(sourceAst))sourceAstDouble.push('resource');
if(/RouteScanner\.scanAsts\(projectRoot/.test(sourceAst)&&/RouteScanner\.scan\(projectRoot/.test(sourceAst))sourceAstDouble.push('route');
const freeData=[];
for(const [file,text] of [['pipelineScanner.ts',pipeline],['sourceAstScanner.ts',sourceAst]]){
 for(const [pattern,kind] of [[/\bnew Map\(/,'runtime_index'],[/\?\?/,'nullish_fallback'],[/\?\./,'optional_fallback'],[/Record<|Readonly<Record</,'free_record']]) if(pattern.test(text))freeData.push({file,kind});
}
const findings=[];
if(missing.length)findings.push({severity:'critical',kind:'source_category_missing_from_adt',categories:missing});
if(astTypeLies.length)findings.push({severity:'critical',kind:'adt_construction_lie',items:astTypeLies});
if(pipelineRescans.length)findings.push({severity:'critical',kind:'legacy_rescan_after_origin_boundary',items:pipelineRescans});
if(sourceAstDouble.length)findings.push({severity:'high',kind:'duplicate_source_interpretation',categories:sourceAstDouble});
if(freeData.length)findings.push({severity:'high',kind:'free_data_or_fallback',items:freeData});
const report={schema:'routesync.data-loss-trace/v19',target:'Laravel examples/ecommerce-shop-source -> AST/ADT -> SourceAsts -> manifest',method:{rules:['AST claims are valid only when the implementation constructs the declared ADT.','Existing high-level ADTs are the only semantic source; no parallel production interfaces.','Legacy projectRoot rescans after the canonical boundary are critical until proven redundant.','Record/Map/nullish/optional fallback in semantic boundaries are risks, not proof of loss.','Legacy manifest is never evidence for the repaired scanner.']},sourceEvidence:{phpFiles:php.length,legacyManifestRejected:true},coverage:{expectedSourceCategories:expected,missingFromSourceAsts:missing},pipelineRescans,astTypeLies,duplicateSourceInterpretation:sourceAstDouble,freeDataAudit:freeData,findings,repairOrder:[
 {order:1,action:'Repair ADT construction lies first; RouteAst must be constructed from existing ParsedRoute semantics before being accepted by SourceAsts.'},
 {order:2,action:'Then trace RouteAst fields into the existing pipeline and remove RouteScanner projectRoot rescan only after field completeness is proven.'},
 {order:3,action:'Do the same for ResourceAst and RequestAst; adapters may transform existing models but must not introduce parallel semantic interfaces.'},
 {order:4,action:'Replace runtime Map/indexes at semantic boundaries with explicit existing ADT collections only where they carry domain meaning; local algorithmic indexes may remain internal.'},
 {order:5,action:'Re-run field-level lineage against fresh Laravel ecommerce-shop AST output; never validate from legacy manifest.'}
]};
const out=path.join(root,'data-loss-trace-v19.json');fs.writeFileSync(out,JSON.stringify(report,null,2));console.log(JSON.stringify({out,status:findings.length?'REPAIR_REQUIRED':'CLEAN',phpFiles:php.length,astTypeLies:astTypeLies.length,pipelineRescans:pipelineRescans.map(x=>x.scanner),duplicateSourceInterpretation:sourceAstDouble,freeData:freeData.length},null,2));
