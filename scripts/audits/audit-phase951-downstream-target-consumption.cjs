const fs = require('fs');
const path = require('path');
const root = path.resolve(__dirname, '../..');
const core = path.join(root, 'packages/core/src');
const cli = path.join(root, 'packages/cli/src');

function read(p){ return fs.readFileSync(p,'utf8'); }
function exists(p){ return fs.existsSync(p); }
function walk(dir){
  const out=[];
  if(!exists(dir)) return out;
  for(const e of fs.readdirSync(dir,{withFileTypes:true})){
    const p=path.join(dir,e.name);
    if(e.isDirectory()) out.push(...walk(p));
    else if(e.isFile() && p.endsWith('.ts')) out.push(p);
  }
  return out;
}
const domainFiles = [...walk(path.join(core,'compiler/domain')), ...walk(path.join(core,'compiler/passes')), ...walk(path.join(core,'ir'))];
const downstreamScannerImports = domainFiles.filter(p => /scanner[\\/]lexer|scanner[\\/]upstream/.test(read(p))).map(p=>path.relative(root,p));
const activeBridge = read(path.join(cli,'generators/bridge/bridgePipeline.ts'));
const activeEmitter = read(path.join(cli,'generators/bridge/coreFilesEmitter.ts'));
const activeLowerers = read(path.join(core,'compiler/passes/outputLowerers.ts'));
const legacyEmitter = path.join(core,'compiler/emitters/TypeScriptEmitter.ts');
const emitterIndex = read(path.join(core,'compiler/emitters/index.ts'));
const compilerIndex = read(path.join(core,'compiler/index.ts'));
const activeGenerator = path.join(core,'compiler/generators/typescript/TypeScriptGenerator.ts');
const targetNodes = path.join(core,'compiler/target/typescript/nodes');
const checks = {
  noDownstreamScannerImports: downstreamScannerImports.length === 0,
  activeBridgeCallsLowerers: ['lowerReadTypesOutput','lowerFormTypesOutput','lowerContractsOutput','lowerApiFieldsOutput','lowerMappersOutput'].every(x=>activeBridge.includes(x)),
  coreEmitterWritesAllBundleOutputs: ['api-read.ts','api-form.ts','api-contract.ts','api-field.ts','api-mapper.ts'].every(x=>activeEmitter.includes(x)),
  outputLowerersAreActive: ['lowerReadTypesOutput','lowerContractsOutput','lowerApiFieldsOutput','lowerMappersOutput'].every(x=>activeLowerers.includes(x)),
  activeTypeScriptGeneratorExists: exists(activeGenerator),
  targetTypeScriptNodesExist: exists(targetNodes),
  legacyEmitterNotExported: !emitterIndex.includes("TypeScriptEmitter") && !compilerIndex.includes('TypeScriptEmitter'),
  legacyEmitterIsolated: !exists(legacyEmitter) || !emitterIndex.includes('TypeScriptEmitter')
};
const result={
  phase:951,
  downstreamScannerImports,
  activePath:'RouteManifest -> compileManifest -> outputLowerers -> CoreFilesEmitter/client emitters -> generated artifacts',
  legacyEmitterStatus: exists(legacyEmitter) ? 'isolated-not-exported' : 'removed',
  checks,
  clean:Object.values(checks).every(Boolean) && downstreamScannerImports.length===0
};
console.log(JSON.stringify(result,null,2));
process.exit(result.clean?0:1);
