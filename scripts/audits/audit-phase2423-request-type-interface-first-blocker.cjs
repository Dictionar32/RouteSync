const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = (relative) => fs.readFileSync(path.join(root, relative), 'utf8');
const checks = [
  ['active lowering still calls legacy projection pipeline', /requestTypeDerivationProjectionPipeline\.derive\(/.test(read('packages/core/src/compiler/scanner/wiring/routeManifestTypeLowering.ts'))],
  ['route flow provenance preserves declarationSpan', /interface RouteProvenanceContract\s*\{[\s\S]*?declarationSpan:\s*import/.test(read('packages/core/src/types/domain/routes.ts'))],
  ['request type route occurrence location carries exact declaration span', /kind: 'route_declaration_location'[\s\S]*?file:[\s\S]*?line:[\s\S]*?span: RouteSemanticFlow\['provenance'\]\['declarationSpan'\]/.test(read('packages/core/src/types/upstream/requestTypeDerivationInterface.ts'))],
  ['canonical route evidence owns and forwards original declaration span', /span: Object\.freeze\(\{[\s\S]*?start: Object\.freeze\(\{ kind: 'number_value' as const, value: declaration\.source\.startOffset \}\)[\s\S]*?end: Object\.freeze\(\{ kind: 'number_value' as const, value: declaration\.end\.endOffset \}\)/.test(read('packages/core/src/compiler/scanner/operations/routeProducerRelations.ts')) && /const sourceSpan = evidence\.span/.test(read('packages/core/src/compiler/scanner/wiring/laravelRouteScanner.ts'))],
  ['authority-backed lowering remains injected, not active default', /createAuthorityBackedRouteManifestTypeLowering/.test(read('packages/core/src/compiler/scanner/wiring/routeManifestTypeLoweringAuthority.ts')) && !/createAuthorityBackedRouteManifestTypeLowering/.test(read('packages/core/src/compiler/scanner/wiring/routeManifestTypeLowering.ts'))],
];
for (const [label, passed] of checks) console.log(`${passed ? 'PASS' : 'FAIL'} ${label}`);
if (checks.some(([, passed]) => !passed)) process.exitCode = 1;
