const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const root = path.resolve(__dirname, '../..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const contract = read('packages/core/src/types/upstream/requestTypeDerivationInterface.ts');
const resolver = read('packages/core/src/compiler/semantic/request-type-derivation/requestTypeDerivationProductionComposition.ts');
const scan = read('packages/cli/src/commands/scan.ts');
const sync = read('packages/cli/src/commands/sync.ts');
const checks = [
  ['canonical upstream contract singleton owns the complete canonical law union', /export const requestTypeDerivationContract: RequestTypeDerivationContract/.test(contract) && /REQUEST_TYPE_DERIVATION_LAW_IDS/.test(contract) && /Readonly<\s*Record<RequestTypeDerivationLawId, 'required'>\s*>/.test(contract)],
  ['pipeline resolution preserves the existing available outcome', /kind: 'request_type_semantic_pipeline_available'/.test(contract)],
  ['pipeline resolution models contract identity mismatch as a closed ADT', /reason: 'semantic_contract_identity_mismatch'/.test(contract)],
  ['contract mismatch carries expected and supplied canonical contract evidence', /expectedContract: RequestTypeDerivationContract/.test(contract) && /suppliedContract: RequestTypeDerivationContract/.test(contract)],
  ['resolver compares pipeline contract by canonical object identity', /input\.pipeline\.contract === requestTypeDerivationContract/.test(resolver)],
  ['resolver rejects noncanonical pipeline contract before exposing availability', /semantic_contract_identity_mismatch/.test(resolver) && /suppliedContract: input\.pipeline\.contract/.test(resolver)],
  ['missing composition remains a separate unavailable outcome', /case 'cli_upstream_composition_missing'/.test(resolver) && /reason: 'cli_upstream_composition_missing'/.test(resolver)],
  ['scan blocks unavailable pipeline before project identity acquisition', /requestTypeDerivationSemanticPipelineResolution\.resolve[\s\S]*?request_type_semantic_pipeline_unavailable[\s\S]*?createLaravelSourceProjectIdentity/.test(scan)],
  ['sync blocks unavailable pipeline before project identity acquisition', /requestTypeDerivationSemanticPipelineResolution\.resolve[\s\S]*?request_type_semantic_pipeline_unavailable[\s\S]*?createLaravelSourceProjectIdentity/.test(sync)],
  ['scan reports canonical contract binding as a composition requirement', /canonical upstream contract/.test(scan)],
  ['sync reports canonical contract binding as a composition requirement', /canonical upstream contract/.test(sync)],
  ['resolver does not import legacy solver or invent proof coverage', !/requestTypeDerivationSolver|verifiedLaws\s*:\s*Object\.freeze/.test(resolver)],
];
let failures = 0;
for (const [label, condition] of checks) {
  console.log(`${condition ? 'PASS' : 'FAIL'} ${label}`);
  if (!condition) failures += 1;
}
for (const [name, source] of [['contract', contract], ['resolver', resolver], ['scan', scan], ['sync', sync]]) {
  const result = ts.transpileModule(source, { fileName: `${name}.ts`, compilerOptions: { target: ts.ScriptTarget.ES2024, module: ts.ModuleKind.ESNext }, reportDiagnostics: true });
  const errors = (result.diagnostics || []).filter(item => item.category === ts.DiagnosticCategory.Error);
  console.log(`${errors.length === 0 ? 'PASS' : 'FAIL'} TypeScript syntax transpilation: ${name}`);
  failures += errors.length;
}
console.log(`Phase 2573: ${checks.length + 4 - failures}/${checks.length + 4} assertions passed.`);
process.exitCode = failures ? 1 : 0;
