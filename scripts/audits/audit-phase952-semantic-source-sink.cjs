const fs = require('fs');
const path = require('path');
const root = path.resolve(__dirname, '../..');
const core = path.join(root, 'packages/core/src');
const cli = path.join(root, 'packages/cli/src');
const read = p => fs.readFileSync(p, 'utf8');
const exists = p => fs.existsSync(p);
const walk = dir => {
  const out = [];
  if (!exists(dir)) return out;
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) out.push(...walk(p));
    else if (e.isFile() && p.endsWith('.ts')) out.push(p);
  }
  return out;
};
const rel = p => path.relative(root, p);
const domain = [...walk(path.join(core, 'compiler/domain')), ...walk(path.join(core, 'compiler/passes')), ...walk(path.join(core, 'ir'))];
const allSource = [...walk(core), ...walk(cli)];
const forbiddenDownstreamScanner = domain.filter(p => /scanner[\\/]lexer|scanner[\\/]upstream/.test(read(p))).map(rel);
const bridge = read(path.join(cli, 'generators/bridge/bridgePipeline.ts'));
const emitter = read(path.join(cli, 'generators/bridge/coreFilesEmitter.ts'));
const lowerers = read(path.join(core, 'compiler/passes/outputLowerers.ts'));
const manifestFacade = read(path.join(cli, 'generators/utils/manifest-to-types.ts'));
const generator = read(path.join(core, 'compiler/generators/typescript/TypeScriptGenerator.ts'));
const compilerIndex = read(path.join(core, 'compiler/index.ts'));
const emittersIndex = read(path.join(core, 'compiler/emitters/index.ts'));
const oldEmitter = path.join(core, 'compiler/emitters/TypeScriptEmitter.ts');
const oldContractEmitter = path.join(core, 'compiler/emitters/ContractEmitter.ts');
const checks = {
  sourceManifestFacade: /manifestToSemanticTypes|manifestToContractInput/.test(bridge) || /SemanticTypesPipeline|ContractInputPipeline/.test(manifestFacade),
  lowererPath: ['lowerReadTypesOutput','lowerFormTypesOutput','lowerContractsOutput','lowerApiFieldsOutput','lowerMappersOutput'].every(x => bridge.includes(x) && lowerers.includes(x)),
  sinkPath: ['api-read.ts','api-form.ts','api-contract.ts','api-field.ts','api-mapper.ts'].every(x => emitter.includes(x)),
  activeTypeScriptGenerator: exists(path.join(core, 'compiler/generators/typescript/TypeScriptGenerator.ts')) && /ContractGraph/.test(generator),
  noLegacyEmitter: !exists(oldEmitter) && !exists(oldContractEmitter),
  noLegacyEmitterExports: !compilerIndex.includes('ContractEmitter') && !emittersIndex.includes('ContractEmitter') && !emittersIndex.includes('TypeScriptEmitter'),
  noDownstreamScannerImports: forbiddenDownstreamScanner.length === 0,
  noUpstreamReverseImports: allSource.filter(p => /types[\\/]upstream/.test(p) && /semantic[\\/]kernel|compiler[\\/]scanner|compiler[\\/]domain|compiler[\\/]passes|compiler[\\/]ir/.test(read(p))).length === 0
};
const result = {
  phase: 952,
  path: 'RouteManifest -> manifestTo* -> outputLowerers -> CoreFilesEmitter/client emitters -> generated artifacts',
  forbiddenDownstreamScanner,
  checks,
  clean: Object.values(checks).every(Boolean)
};
console.log(JSON.stringify(result, null, 2));
process.exit(result.clean ? 0 : 1);
