const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = rel => fs.readFileSync(path.join(root, rel), 'utf8');
const authority = read('packages/core/src/types/upstream/routeCapabilitySemanticAuthority.ts');
const authorityAlgebra = authority;
const resolution = read('packages/core/src/compiler/scanner/resolvers/boundary/capabilityResolution.ts');
const boundary = read('packages/core/src/compiler/scanner/resolvers/boundary/boundaryBasicsTypes.ts');
const inputResolution = read('packages/core/src/compiler/scanner/resolvers/boundary/boundaryInputResolution.ts');
const builder = read('packages/core/src/compiler/scanner/resolvers/boundary/capabilityBuilder.ts');
const operationIdentity = read('packages/core/src/types/upstream/operationIdentityCapabilityAuthority.ts');
const operationIdentityAlgebra = read('packages/core/src/types/upstream/operationIdentityCapabilityAlgebra.ts');
const packageJson = JSON.parse(read('package.json'));
const checks = [
  [/reasoning:\s*semanticReasoningContract\('evidence_resolution'\)/.test(authorityAlgebra), 'upstream semantic reasoning algebra creates the canonical proof contract'],
  [/readonly reasoning: import\([\s\S]*SemanticReasoningContract<'evidence_resolution'>/.test(resolution), 'resolved capability exposes the exact proof type'],
  [/reasoning:\s*capability\.reasoning/.test(inputResolution), 'boundary wiring forwards the exact upstream proof'],
  [/readonly reasoning: import\([\s\S]*SemanticReasoningContract<'evidence_resolution'>/.test(boundary), 'resolved boundary contract preserves proof lineage'],
  [/const reasoning = params\.reasoning/.test(builder), 'capability builder consumes the upstream proof'],
  [!/semanticReasoningContract\(/.test(builder), 'capability builder does not mint a second proof'],
  [/strategy:\s*reasoning\.strategy/.test(builder), 'capability derivation strategy agrees with preserved proof'],
  [/const reasoning:\s*SemanticReasoningContract\s*=\s*input\.reasoning/.test(operationIdentityAlgebra), 'operation identity algebra preserves the upstream reasoning proof'],
  [packageJson.scripts?.['audit:phase1316-proof-preserving-route-capability'] === 'node scripts/audits/audit-phase1316-proof-preserving-route-capability.cjs', 'package script exposes the regression audit'],
];
const failures = checks.filter(([ok]) => !ok).map(([, label]) => label);
const passes = checks.filter(([ok]) => ok).map(([, label]) => label);
const result = { audit: 'phase1316-proof-preserving-route-capability', passed: failures.length === 0, passedChecks: passes.length, passes, failures };
process.stdout.write(JSON.stringify(result, null, 2) + '\n');
process.exitCode = failures.length ? 1 : 0;
