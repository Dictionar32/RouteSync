const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = (p) => fs.readFileSync(path.join(root, p), 'utf8');
const checks = [
  ['core barrel exports semantic dataflow runtime value', /export\s*\{[^}]*semanticDataflowInputAdapterOperations[^}]*\}\s*from\s*['"]\.\/compiler\/scanner\/wiring\/semanticDataflowInputAdapter['"]/.test(read('packages/core/src/index.ts'))],
  ['core barrel exports semantic dataflow operation interface', /export\s+type\s*\{[^}]*SemanticDataflowInputAdapterOperationsInterface[^}]*\}\s*from\s*['"]\.\/compiler\/scanner\/wiring\/semanticDataflowInputAdapter['"]/.test(read('packages/core/src/index.ts'))],
  ['core barrel exports payload-location runtime value', /export\s*\{[^}]*routePayloadLocationOperations[^}]*\}\s*from\s*['"]\.\/types\/upstream\/routeExecutionVocabulary['"]/.test(read('packages/core/src/index.ts'))],
  ['core barrel exports payload-location interface', /export\s+type\s*\{[^}]*RoutePayloadLocationOperationsInterface[^}]*\}\s*from\s*['"]\.\/types\/upstream\/routeExecutionVocabulary['"]/.test(read('packages/core/src/index.ts'))],
  ['CLI generator barrel exports validation operations', /manifestContractValidationOperations/.test(read('packages/cli/src/generators/index.ts'))],
  ['CLI generator barrel exports serialization operations', /manifestSerializationOperations/.test(read('packages/cli/src/generators/index.ts'))],
  ['CLI generator barrel exports generation operations', /manifestGeneratorOperations/.test(read('packages/cli/src/generators/index.ts'))],
  ['CLI generator barrel exports operation contracts', /ManifestContractValidationOperationsInterface/.test(read('packages/cli/src/generators/index.ts')) && /ManifestSerializationOperationsInterface/.test(read('packages/cli/src/generators/index.ts')) && /ManifestGeneratorOperationsInterface/.test(read('packages/cli/src/generators/index.ts'))],
  ['Phase 2759 trace documentation exists', fs.existsSync(path.join(root, 'PHASE2759_PUBLIC_BARREL_AND_RUNTIME_ADT_AUDIT.md'))],
];
let failed = 0;
for (const [label, ok] of checks) { console.log(`${ok ? 'PASS' : 'FAIL'} ${label}`); if (!ok) failed++; }
console.log(`Phase 2759 public barrel/runtime ADT audit: ${checks.length - failed}/${checks.length}`);
if (failed) process.exitCode = 1;
