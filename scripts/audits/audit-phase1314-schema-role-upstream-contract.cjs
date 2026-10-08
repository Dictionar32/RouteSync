const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');
const checks = [
  ['upstream route capability closes schema role', /readonly schemaRole: 'request' \| 'response'/.test(read('packages/core/src/types/upstream/route.ts'))],
  ['schema role is explicit upstream evidence and defaults to request-validation semantics', /readonly schemaRole: Presence<'request' \| 'response'>/.test(read('packages/core/src/types/upstream/routeCapabilitySemanticAuthority.ts')) && /presenceFold\(overrides\.schemaRole, \(\) => 'request' as const/.test(read('packages/core/src/types/upstream/routeCapabilitySemanticAuthority.ts'))],
  ['schema role is not inferred from hook kind', !/schemaRole[^;\n]*hookKind|hookKind[^;\n]*schemaRole/.test(read('packages/core/src/types/upstream/routeCapabilitySemanticAuthority.ts'))],
  ['schema-role evidence crosses the scanner boundary', /schemaRole: params\.schemaRole/.test(read('packages/core/src/compiler/scanner/resolvers/boundary/boundaryInputResolution.ts')) && /schemaRole: input\.schemaRole/.test(read('packages/core/src/compiler/scanner/resolvers/boundary/capabilityResolution.ts'))],
  ['closed capability builder preserves schema role', /schemaRole: params\.schemaRole/.test(read('packages/core/src/compiler/scanner/resolvers/boundary/capabilityBuilder.ts'))],
  ['route declaration carries closed schema role', /schemaRole: capability\.schemaRole/.test(read('packages/core/src/compiler/scanner/descriptors/route/routeDeclarations.ts'))],
  ['CLI projection emits upstream schema role', /schemaRole: '\$\{route\.raw\.capability\.schemaRole\}'/.test(read('packages/cli/src/generators/sdk/apiObjectEmitter.ts'))],
  ['SDK schema mapper does not classify from hook kind', !/route\.hookKind|hookKind === 'query'/.test(read('packages/sdk/src/api-runtime/schemaMapper.ts'))],
  ['SDK schema mapper requires closed schema-role capability', /const schemaRole = route\.schemaRole/.test(read('packages/sdk/src/api-runtime/schemaMapper.ts'))],
];
let failed = 0;
for (const [label, ok] of checks) {
  process.stdout.write(`${ok ? 'PASS' : 'FAIL'} ${label}\n`);
  if (!ok) failed += 1;
}
process.stdout.write(`Phase 1315: ${checks.length - failed}/${checks.length} checks passed\n`);
process.exitCode = failed ? 1 : 0;
