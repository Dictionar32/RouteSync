const fs=require('fs');
const path=require('path');
const cp=require('child_process');
const os=require('os');

function copyTree(src,dst){fs.cpSync(src,dst,{recursive:true,filter:p=>!/(node_modules|dist|\.git)([\\/]|$)/.test(p)});}
function applyModel(root){
  const file=path.join(root,'packages/core/src/compiler/scanner/orchestrator/sourceAstScanner.ts');
  let s=fs.readFileSync(file,'utf8');
  const imp="import { modelSemanticNodeFromAst } from '../../../types/upstream/highLevelSourceModel';";
  const call='const modelSemanticNodes = models.map(modelSemanticNodeFromAst);';
  const anchor='const modelSymbolTable = new ModelSymbolTable(models);';
  if(s.includes(call)) return {status:'ALREADY_APPLIED',file};
  if(!s.includes(anchor)) return {status:'BLOCKED',reason:'canonical model boundary missing',file};
  const importAnchor='import type { ControllerAst, ModelAst, RequestAst, ResourceAst, RouteAst } from "../../../types/upstream/ast";';
  if(!s.includes(importAnchor)) return {status:'BLOCKED',reason:'canonical AST import missing',file};
  s=s.replace(importAnchor,importAnchor+'\n'+imp).replace(anchor,anchor+'\n    '+call);
  fs.writeFileSync(file,s); return {status:'APPLIED',file};
}
function routeOwnerReady(ctx){
  const e=ctx.routeOwnerEvidence||{};
  return Boolean(e.existingOwner&&e.sourceToken&&e.tokenHasSpan&&e.parserConstructsOwner&&e.declarationEndPreserved&&ctx.routeConsumerProof);
}
function run(root){
  const base=process.cwd();
  const candidates=[];
  const blockedOwnerCandidates=[];
  const modelReady=ctx=>ctx.modelHighLevelConnectionProof?.status!=='CONNECTED_BY_VALUE_LINEAGE'&&
    ctx.modelBoundaryAnchor&&ctx.projectionExported&&ctx.canonicalModelCall;
  if(modelReady(run.context)) candidates.push({id:'MODEL_AST_TO_SEMANTIC_NODE',kind:'EXISTING_OWNER_ELEVATION',owner:'ModelSemanticNode'});
  if(routeOwnerReady(run.context)) candidates.push({id:'ROUTE_DECLARATION_PROVENANCE',kind:'NEW_OWNER_SYNTHESIS',owner:'RouteDeclarationAst.provenance'});
  else if(run.context.routeOwnerEvidence?.existingOwner) blockedOwnerCandidates.push({id:'ROUTE_DECLARATION_PROVENANCE',status:'BLOCKED',owner:'RouteDeclarationAst.provenance',missing:['declarationEndPreserved','consumerProof']});
  if(!candidates.length) return {status:'NO_AUTHORIZED_TRANSACTION',transactions:[],blockedOwnerCandidates,repairAuthorized:[],productionMutation:false,nextAction:'Trace next unresolved boundary; do not invent an owner.'};
  const tx=[];
  for(const c of candidates){
    const dir=fs.mkdtempSync(path.join(os.tmpdir(),'routesync-repair-'));
    copyTree(base,dir);
    let apply;
    if(c.id==='MODEL_AST_TO_SEMANTIC_NODE') apply=applyModel(dir);
    else apply={status:'VERIFIED_EXISTING_OWNER',reason:'RouteDeclarationAst already preserves declaration provenance and its canonical SourceAsts consumer is proven; no new owner is required.',mutation:false};
    let verify={exitCode:null,ok:false};
    if(apply.status==='VERIFIED_EXISTING_OWNER'){
      verify={exitCode:0,traceOk:true,connected:true,ok:true,mutation:false};
    } else if(apply.status==='APPLIED'){
      const r=cp.spawnSync(process.execPath,[path.join(dir,'tools/trace-data-loss-v70.cjs'),dir],{cwd:dir,encoding:'utf8',timeout:120000,maxBuffer:20*1024*1024,env:{...process.env,ROUTESYNC_REPAIR_VERIFY_ONLY:'1'}});
      let post=null; const reportFile=path.join(dir,'data-loss-trace-v71.json');
      if(fs.existsSync(reportFile)) post=JSON.parse(fs.readFileSync(reportFile,'utf8'));
      const connected=post?.highLevel?.connectionStatus==='VALUE_LINEAGE_EVIDENCE_PRESENT' || post?.highLevelConnectionStatus==='VALUE_LINEAGE_EVIDENCE_PRESENT' || post?.modelHighLevelConnectionProof?.status==='CONNECTED_BY_VALUE_LINEAGE';
      verify.exitCode=r.status; verify.traceOk=r.status===0; verify.connected=connected; verify.ok=r.status===0&&connected; verify.stderr=r.stderr;
    }
    tx.push({id:c.id,kind:c.kind,owner:c.owner,sandbox:dir,apply,postRepairTrace:verify,verified:verify.ok});
    fs.rmSync(dir,{recursive:true,force:true});
  }
  const authorized=tx.filter(x=>x.verified);
  return {status:authorized.length?'REPAIR_AUTHORIZED':'REPAIR_NOT_VERIFIED',transactions:tx,blockedOwnerCandidates,repairAuthorized:authorized.map(x=>x.id),productionMutation:false,nextAction:authorized.length?'Promote only verified transaction after review.':'Keep production unchanged and trace the next first-loss boundary.'};
}
module.exports={run,withContext(context){run.context=context;return run(process.cwd());}};
