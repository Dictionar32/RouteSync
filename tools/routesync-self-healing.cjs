#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const cp = require('child_process');

const repositoryRoot = path.resolve(__dirname, '..');
const sourceRoot = path.resolve(repositoryRoot, process.argv[2] || 'examples/ecommerce-shop-source');
const output = path.resolve(repositoryRoot, process.argv.includes('--out') ? process.argv[process.argv.indexOf('--out') + 1] : 'self-healing-report.json');

function fail(message) { console.error(`SELF_HEALING_BLOCKED: ${message}`); process.exitCode = 2; }
function rel(file) { return path.relative(repositoryRoot, file).split(path.sep).join('/'); }
function phpFiles(root) { return fs.readdirSync(root, {withFileTypes:true}).flatMap(e => { const f=path.join(root,e.name); return e.isDirectory() ? phpFiles(f) : f.endsWith('.php') ? [f] : []; }); }
function sourceEvidence(root) {
  const files=phpFiles(root); const constructs=[];
  for(const file of files){
    const text=fs.readFileSync(file,'utf8');
    const add=(kind,token)=>{ if(text.includes(token)) constructs.push({kind,token,file:path.relative(root,file).split(path.sep).join('/')}); };
    add('model_property','$fillable'); add('model_property','$table'); add('model_property','$hidden'); add('model_property','$appends');
    add('route_declaration','Route::'); add('controller_class','extends Controller'); add('form_request','extends FormRequest'); add('resource','extends JsonResource');
  }
  return {phpFiles:files.length,constructs};
}

function evidenceGraph(root, trace) {
  const source = path.join(root, 'routes', 'api.php');
  const routeSourceExists = fs.existsSync(source);
  const modelFiles = phpFiles(path.join(root, 'app', 'Models')).map(file => path.relative(root, file).split(path.sep).join('/'));
  const nodes = [
    { id: 'laravel_source', kind: 'SOURCE', status: 'PROVEN', evidence: `${path.relative(root, root) || '.'}` },
    { id: 'lexer', kind: 'LEXER', status: 'PROVEN', evidence: 'LaravelSourceLexer' },
    { id: 'php_ast_adt', kind: 'AST_ADT', status: 'PROVEN', evidence: 'repository PHP AST/ADT' },
    { id: 'semantic_owner', kind: 'SEMANTIC_OWNER', status: trace.modelHighLevelConnectionProof?.status === 'CONNECTED_BY_VALUE_LINEAGE' ? 'PROVEN' : 'PARTIAL', evidence: 'ModelFacts / ModelSemanticNode' },
    { id: 'source_asts', kind: 'CANONICAL_SOURCE_AST', status: trace.completeModelConnected ? 'PROVEN' : 'PARTIAL', evidence: 'scanSourceAsts' },
    { id: 'manifest', kind: 'MANIFEST', status: trace.completeModelConnected ? 'PROVEN' : 'UNPROVEN', evidence: 'upstreamManifestScanner' }
  ];
  const edges = [
    { from: 'laravel_source', to: 'lexer', status: 'PROVEN', evidence: `${trace.sourceEvidence?.project || 'Laravel source'} -> LaravelSourceLexer` },
    { from: 'lexer', to: 'php_ast_adt', status: trace.ast?.declarations ? 'PROVEN' : 'UNPROVEN', evidence: 'lexer/parser declaration evidence' },
    { from: 'php_ast_adt', to: 'semantic_owner', status: trace.modelPropertyAstBoundaryStatus === 'AST_PRODUCER_AND_CONSUMER_PROVEN' ? 'PROVEN' : 'PARTIAL', evidence: 'model property AST -> ModelFacts' },
    { from: 'semantic_owner', to: 'source_asts', status: trace.modelHighLevelConnectionProof?.status === 'CONNECTED_BY_VALUE_LINEAGE' ? 'PROVEN' : 'UNPROVEN', evidence: 'value-level producer/consumer proof required' },
    { from: 'source_asts', to: 'manifest', status: trace.manifest?.producerBoundary?.returnsRouteSyncManifest ? 'PROVEN' : 'UNPROVEN', evidence: 'SourceAsts -> CompleteSourceAst -> RouteSyncManifest' }
  ];
  const route = {
    sourceFile: routeSourceExists ? 'routes/api.php' : null,
    declarationOwner: trace.routeOwnerEvidence?.existingOwner ? 'RouteDeclarationAst' : null,
    declarationStart: trace.routeOwnerEvidence?.sourceToken && trace.routeOwnerEvidence?.tokenHasSpan ? 'PROVEN' : 'UNPROVEN',
    declarationEnd: trace.routeOwnerEvidence?.declarationEndPreserved ? 'PROVEN' : 'UNPROVEN',
    semanticConsumer: trace.routeOwnerEvidence?.consumerProof ? 'PROVEN' : 'UNPROVEN'
  };
  return { nodes, edges, route, sourceCoverage: { modelFiles: modelFiles.length, routeFile: routeSourceExists } };
}

function repairReadiness(trace) {
  const highSemanticFallbacks = (trace.semanticFreeData || []).filter(x => x.classification === 'SEMANTIC_FALLBACK' && x.confidence === 'HIGH');
  const legacyCompatibilityPipeline = (trace.pipelineRescans || 0) > 0 &&
    trace.highLevelProductionFlowConnected === true &&
    (trace.completeModelProducerStatus || '') === 'PROVEN' &&
    trace.manifest?.producerBoundary?.returnsRouteSyncManifest === true;
  const canonicalNestedRescans = (trace.findings || []).filter((finding) => {
    if (finding.kind !== 'nested_project_root_rescan') return false;
    const file = finding.detail?.file || '';
    const callee = finding.detail?.callee || '';
    if (file.endsWith('scannerLegacyDelegates.ts')) return false;
    if (file.endsWith('FormRequestScanner.ts') && callee === 'FormRequestScanner.scanAsts') return false;
    if (file.endsWith('RouteScanner.ts') && callee === 'ControllerScanner.scan') return false;
    return finding.detail?.originOrchestrator === true;
  }).length;
  const sourceIngestion = canonicalNestedRescans === 0 && !trace.hiddenRescans
    ? 'PROVEN'
    : 'REPAIR_REQUIRED';
  return {
    model: trace.modelHighLevelConnectionProof?.status === 'CONNECTED_BY_VALUE_LINEAGE' ? 'PROVEN' : 'UNPROVEN',
    route: trace.ownerSynthesis?.blocked?.length ? 'BLOCKED_UNTIL_PROVENANCE_AND_CONSUMER' : 'UNPROVEN',
    semanticFallbacks: highSemanticFallbacks.length ? 'REPAIR_REQUIRED' : 'PROVEN',
    sourceIngestion,
    legacyCompatibilityPipeline: legacyCompatibilityPipeline ? 'SEPARATE_COMPATIBILITY_PATH' : 'UNPROVEN',
    productionMutation: false
  };
}

function runTrace() {
  const trace=cp.spawnSync(process.execPath,[path.join(repositoryRoot,'tools/trace-data-loss-v70.cjs'),repositoryRoot],{cwd:repositoryRoot,encoding:'utf8',timeout:180000,maxBuffer:40*1024*1024});
  if(trace.status!==0) throw new Error(trace.stderr || 'trace failed');
  const report=JSON.parse(fs.readFileSync(path.join(repositoryRoot,'data-loss-trace-v71.json'),'utf8'));
  return report;
}
function classify(report, evidence) {
  const gaps=[];
  const add=(id,status,reason,repair)=>gaps.push({id,status,reason,repair});
  if((report.returnTypeMismatches||0)>0) add('AST_PRODUCER_RETURN_CONTRACT','REPAIR_REQUIRED','A canonical *Ast producer still returns a legacy descriptor shape.','Repair the producer at the AST boundary; do not cast or widen downstream.');
  if((report.delegateMismatches||0)>0) add('AST_DELEGATE_CONTRACT','REPAIR_REQUIRED','A canonical AST scanner delegates to a legacy scanner with a different semantic return shape.','Connect the canonical builder directly or prove an existing mapper.');
  if((report.hiddenRescans||0)>0) add('SOURCE_INGESTION_MULTIPLICITY','REPAIR_REQUIRED','Canonical source ingestion still has hidden scanner re-entry paths.','Make the canonical AST/ADT boundary the only source-ingestion owner; downstream scanners must consume its values.');
  const legacyCompatibilityPipeline = (report.pipelineRescans||0) > 0 &&
    (report.highLevelProductionFlowConnected === true) &&
    (report.completeModelProducerStatus || '') === 'PROVEN' &&
    (report.manifest?.producerBoundary?.returnsRouteSyncManifest === true);
  const canonicalNestedFindings = (report.findings || []).filter((finding) => {
    if (finding.kind !== 'nested_project_root_rescan') return false;
    const file = finding.detail?.file || '';
    const callee = finding.detail?.callee || '';
    if (file.endsWith('scannerLegacyDelegates.ts')) return false;
    if (file.endsWith('FormRequestScanner.ts') && callee === 'FormRequestScanner.scanAsts') return false;
    if (file.endsWith('RouteScanner.ts') && callee === 'ControllerScanner.scan') return false;
    return finding.detail?.originOrchestrator === true;
  });
  const canonicalNestedRescans = canonicalNestedFindings.length;
  if(canonicalNestedRescans > 0) {
    add('SEMANTIC_RESCAN','REPAIR_REQUIRED','Canonical source-to-manifest flow still re-enters source-derived scanners.','Collapse the canonical orchestration onto existing SourceAsts/AST values; do not reopen or reinterpret Laravel source.');
  } else if((report.pipelineRescans||0)>0 && !legacyCompatibilityPipeline) {
    add('SEMANTIC_RESCAN','REPAIR_REQUIRED','A non-legacy scanner orchestration still re-enters source-derived scanners after canonical ingestion.','Collapse that orchestration onto the existing SourceAsts/AST values; do not reopen or reinterpret Laravel source.');
  }
  if((report.freeData||0)>0 || (report.semanticFreeData||0)>0) add('SEMANTIC_ESCAPE_HATCH','REPAIR_REQUIRED','Semantic data still escapes canonical ownership.','Trace each value to its source-backed owner before changing interfaces.');
  if((report.completeModelProducerStatus||'')!=='PROVEN') add('COMPLETE_SOURCE_MODEL','MODEL_ELEVATION_REQUIRED','The highest semantic model has no proven production value producer.','Connect or create the canonical producer only from source-backed semantic evidence.');
  const routeEvidence=report.routeOwnerEvidence || {};
  if(routeEvidence.existingOwner && !routeEvidence.consumerProof) add('ROUTE_SEMANTIC_FACTS','MODEL_ELEVATION_REQUIRED','RouteDeclarationAst provenance is proven, but no source-backed producer/consumer path into RouteSemanticNode/RouteFacts is proven.','Trace the existing ParsedRoute/controller/request/response evidence into the existing RouteFacts owner; do not synthesize empty request/response semantics and do not create a parallel interface.');
  if((report.missingCategories||[]).length) add('SOURCE_FAMILY_COVERAGE','MODEL_ELEVATION_REQUIRED',`Canonical source vocabulary is missing: ${report.missingCategories.join(', ')}.`,'Trace the Laravel construct first; extend the existing vocabulary only when source meaning is proven.');
  if((report.ownerSynthesis?.blocked||[]).length) add('OWNER_SYNTHESIS','BLOCKED','A candidate owner lacks complete provenance or consumer proof.','Repair provenance/consumer evidence first; do not synthesize a speculative owner.');
  return {status:gaps.some(x=>x.status==='BLOCKED')?'BLOCKED':gaps.length?'REPAIR_REQUIRED':'SOURCE_FLOW_PROVEN',gaps};
}

if(process.argv.includes('--help')) {
  console.log('Usage: node tools/routesync-self-healing.cjs [source-root] [--out report.json]');
  process.exit(0);
}
if(!fs.existsSync(sourceRoot) || !fs.statSync(sourceRoot).isDirectory()) { fail(`Laravel source root not found: ${sourceRoot}`); process.exit(); }
const legacyManifestFiles=[];
for(const candidate of [path.join(sourceRoot,'routesync.manifest.json'),path.join(sourceRoot,'frontend/routesync.manifest.json')]) if(fs.existsSync(candidate)) legacyManifestFiles.push(rel(candidate));

try {
  const evidence=sourceEvidence(sourceRoot);
  const trace=runTrace();
  const classification=classify(trace,evidence);
  const report={
    schema:'routesync.self-healing/v1',
    tool:'RouteSyncSelfHealingEngine',
    sourceOfTruth:{kind:'LARAVEL_SOURCE',root:rel(sourceRoot),acceptedAsEvidence:true,manifestIsInput:false},
    sourceEvidence:{...evidence,legacyManifestIgnored:legacyManifestFiles},
    flow:{
      stages:['LaravelSource','LexerTokens','PhpAstAdt','SemanticOwnership','CompleteSourceAst','RouteSyncManifest','GeneratedOutput'],
      direction:'SOURCE_TO_DERIVED_VALUES',
      feedback:'FAILED_INVARIANT_TO_SOURCE_EVIDENCE',
      rule:'Repair the lowest proven canonical owner; never repair the manifest directly.'
    },
    invariants:{sourceEvidence:true,legacyManifestRejected:true,legacyManifestUsed:false,failClosed:true,productionMutation:false},
    diagnosis:classification,
    trace:{schema:trace.schema,status:trace.status,critical:trace.critical,high:trace.high,unproven:trace.unproven,returnTypeMismatches:trace.returnTypeMismatches,delegateMismatches:trace.delegateMismatches,hiddenRescans:trace.hiddenRescans,pipelineRescans:trace.pipelineRescans,nestedProjectRootRescans:trace.nestedProjectRootRescans,freeData:trace.freeData,semanticFreeData:trace.semanticFreeData,routeOwnerEvidence:trace.routeOwnerEvidence,modelPropertyAstBoundaryStatus:trace.modelPropertyAstBoundaryStatus,modelHighLevelConnectionProof:trace.modelHighLevelConnectionProof,completeModelConnected:trace.completeModelConnected,manifest:trace.manifest},
    evidenceGraph:evidenceGraph(sourceRoot,trace),
    repairReadiness:repairReadiness(trace),
    repair:{authorized:trace.repairAuthorized||[],transactions:trace.repairTransactions||[],ownerSynthesis:trace.ownerSynthesis||null,productionMutation:false},
    nextAction:classification.gaps.find(x=>x.status==='BLOCKED')?.repair || classification.gaps[0]?.repair || 'Continue source-to-AST/ADT verification.'
  };
  fs.writeFileSync(output,JSON.stringify(report,null,2));
  console.log(JSON.stringify({schema:report.schema,status:report.diagnosis.status,source:report.sourceOfTruth,phpFiles:evidence.phpFiles,gaps:report.diagnosis.gaps.length,authorized:report.repair.authorized,out:rel(output)},null,2));
} catch(error) { fail(error.message); }
