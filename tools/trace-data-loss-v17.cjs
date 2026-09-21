const fs=require('fs'),path=require('path');
const root='/mnt/data/rs-v6',core=path.join(root,'packages/core/src');
const read=f=>fs.readFileSync(path.join(root,f),'utf8');
const pipeline=read('packages/core/src/compiler/scanner/orchestrator/pipelineScanner.ts');
const ast=read('packages/core/src/types/upstream/ast.ts');
const collections=read('packages/core/src/types/upstream/collections.ts');
const complete=read('packages/core/src/types/upstream/completeness.ts');
const source=read('packages/core/src/compiler/scanner/orchestrator/sourceAstScanner.ts');
const findings=[];
const add=(x)=>findings.push(x);
const pipelineScans=[...pipeline.matchAll(/(\w+Scanner)\.scan\(projectRoot/g)].map(m=>m[1]);
const represented=['models','resources','requests','routes','controllers','services','migrations','responses','dtos','middlewares','providers','attributes','channels'];
const representedInSource=represented.filter(k=>new RegExp(`\\b${k}\\s*:`).test(source));
const pipelineConsumedChannels=/discoveredItems\(sourceAsts\.channels\.items\)/.test(pipeline);
add({type:'SOURCE_AST_CATEGORY_COVERAGE',status:representedInSource.length===represented.length?'PROVEN_COMPLETE':'GAP',expected:represented,representedInSource,missing:represented.filter(k=>!representedInSource.includes(k)),repair:'Every source category consumed by the manifest pipeline must exist in the canonical SourceAsts ADT; absence is a model-level loss.'});
add({type:'CHANNEL_PIPELINE_LINEAGE',status:pipelineConsumedChannels?'PROVEN':'BROKEN',source:'Laravel routes/channels.php -> ChannelScanner -> ChannelAst -> SourceAsts.channels -> pipeline',consumer:pipelineConsumedChannels?'SourceAsts.channels':'projectRoot rescan'});
const legacy=['FormRequestScanner','ControllerScanner','ResourceScanner','RouteScanner','ChannelScanner'];
const remaining=legacy.filter(n=>new RegExp(`${n}\\.scan\\(projectRoot`).test(pipeline));
add({type:'LEGACY_RESCAN_AFTER_AST',status:remaining.length?'PROVEN':'CLEARED',remaining,repair:'Replace projectRoot rescans with existing SourceAsts category consumption; migrate one category at a time without parallel interfaces.'});
add({type:'COMPLETENESS_CHANNEL',status:/kind: 'channel'/.test(complete)&&/ast\.channels\.items/.test(complete)?'PROVEN':'GAP',repair:'Completeness must validate channels together with all existing SourceAsts categories.'});
add({type:'TERNARY_REGRESSION_GUARD',status:!/value\.condition\.kind/.test(read('packages/core/src/compiler/scanner/binders/resource/composite/literalTernaryBinders.ts'))?'CLEARED_PATTERN':'PROVEN_LOSS_PATTERN',repair:'Keep full condition AST and joined branch semantic in the existing bound conditional ADT.'});
const status=remaining.length?'LEGACY_RESCAN_AFTER_AST':pipelineConsumedChannels?'UPSTREAM_CHANNEL_CONNECTED':'UPSTREAM_MODEL_GAP';
const report={status,findings,repairOrder:[
 {order:1,action:'Canonical SourceAsts owns every source category actually consumed by the pipeline.'},
 {order:2,action:'Consume existing SourceAsts categories instead of rescanning projectRoot.'},
 {order:3,action:'Trace each consumed AST field into the existing Scanned* descriptor and repair first field loss upstream.'},
 {order:4,action:'Keep ADT completeness explicit; never encode missing source data as null/undefined/fallback.'},
 {order:5,action:'Only a freshly produced manifest from this lineage can validate downstream behavior; legacy manifest remains rejected.'}
]};
fs.writeFileSync(path.join(root,'data-loss-trace-v17.json'),JSON.stringify(report,null,2));
console.log(JSON.stringify({out:path.join(root,'data-loss-trace-v17.json'),status,remaining,channelLineage:pipelineConsumedChannels,categoryCoverage:representedInSource.length+'/'+represented.length},null,2));
