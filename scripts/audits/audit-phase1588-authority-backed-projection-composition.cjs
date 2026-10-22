const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const target = path.join(root, 'packages/core/src/compiler/scanner/wiring/routeManifestProjectionAuthority.ts');
const source = fs.readFileSync(target, 'utf8');
const checks = [
  ['requires injected semantic pipeline', /pipeline:\s*RequestTypeDerivationSemanticPipelineInterface/.test(source)],
  ['uses authority-backed lowering', /createAuthorityBackedRouteManifestTypeLowering\(pipeline\)/.test(source)],
  ['preserves non-projectable outcome', /kind:\s*'not_projectable'/.test(source)],
  ['does not import legacy projection pipeline', !/requestTypeDerivationProjectionPipeline/.test(source)],
  ['does not synthesize empty RequestType output', !/requestTypes:\s*\[\]/.test(source)],
  ['exhaustively handles lowering outcome', /const exhaustive:\s*never/.test(source)],
];
for (const [name, passed] of checks) console.log(`${passed ? 'PASS' : 'FAIL'} ${name}`);
const failed = checks.filter(([, passed]) => !passed);
console.log(`${checks.length - failed.length}/${checks.length} checks passed`);
if (failed.length) process.exitCode = 1;
