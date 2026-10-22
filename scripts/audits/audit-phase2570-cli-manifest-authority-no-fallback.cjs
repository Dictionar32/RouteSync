const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const root = path.resolve(__dirname, '../..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const scan = read('packages/cli/src/commands/scan.ts');
const sync = read('packages/cli/src/commands/sync.ts');
const composition = read('packages/cli/src/upstreamCompositionInterface.ts');
const checks = [
  ['scan no longer imports the default manifest authority as a fallback', !/controllerInvocationManifestCompositionAuthority/.test(scan)],
  ['sync no longer imports the default manifest authority as a fallback', !/controllerInvocationManifestCompositionAuthority/.test(sync)],
  ['scan obtains manifest authority only from the injected composition', /const manifestComposition = composition\?\.manifestComposition/.test(scan)],
  ['sync obtains manifest authority only from the injected composition', /const manifestComposition = composition\?\.manifestComposition/.test(sync)],
  ['scan models absent manifest authority as a terminal blocked outcome', /if \(manifestComposition === undefined\)[\s\S]*?process\.exitCode = 1[\s\S]*?return/.test(scan)],
  ['sync models absent manifest authority as a terminal blocked outcome', /if \(manifestComposition === undefined\)[\s\S]*?process\.exitCode = 1[\s\S]*?return/.test(sync)],
  ['scan composes through the injected authority', /manifestComposition\.compose\(Object\.freeze\(/.test(scan)],
  ['sync composes through the injected authority', /manifestComposition\.compose\(Object\.freeze\(/.test(sync)],
  ['composition interface keeps manifest authority mandatory', /readonly manifestComposition: ControllerInvocationManifestCompositionAuthorityInterface/.test(composition)],
  ['composition interface keeps semantic pipeline mandatory', /readonly requestTypeDerivationPipeline: RequestTypeDerivationSemanticPipelineInterface/.test(composition)],
  ['scan checks upstream semantic pipeline before source acquisition', /requestTypeDerivationSemanticPipelineResolution\.resolve\(composition === undefined[\s\S]*?createLaravelSourceProjectIdentity/.test(scan)],
  ['sync checks upstream semantic pipeline before source acquisition', /requestTypeDerivationSemanticPipelineResolution\.resolve\(composition === undefined[\s\S]*?createLaravelSourceProjectIdentity/.test(sync)],
];
let failures = 0;
for (const [label, condition] of checks) {
  console.log(`${condition ? 'PASS' : 'FAIL'} ${label}`);
  if (!condition) failures += 1;
}
for (const [label, source] of [['scan', scan], ['sync', sync]]) {
  const result = ts.transpileModule(source, { fileName: `${label}.ts`, compilerOptions: { target: ts.ScriptTarget.ES2024, module: ts.ModuleKind.ESNext }, reportDiagnostics: true });
  const errors = (result.diagnostics || []).filter(item => item.category === ts.DiagnosticCategory.Error);
  console.log(`${errors.length === 0 ? 'PASS' : 'FAIL'} syntax transpilation: ${label}`);
  failures += errors.length;
}
console.log(`Phase 2570: ${checks.length + 2 - failures}/${checks.length + 2} assertions passed.`);
process.exitCode = failures ? 1 : 0;
