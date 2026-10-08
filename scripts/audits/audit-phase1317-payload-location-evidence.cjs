const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = rel => fs.readFileSync(path.join(root, rel), 'utf8');
const authority = read('packages/core/src/types/upstream/routeCapabilitySemanticAuthority.ts');
const vocabulary = read('packages/core/src/types/upstream/routeExecutionVocabulary.ts');
const resolution = read('packages/core/src/compiler/scanner/resolvers/boundary/capabilityResolution.ts');
const inputWiring = read('packages/core/src/compiler/scanner/resolvers/boundary/boundaryInputResolution.ts');
const builder = read('packages/core/src/compiler/scanner/resolvers/boundary/capabilityBuilder.ts');
const boundary = read('packages/core/src/compiler/scanner/resolvers/boundary/boundaryBasicsTypes.ts');
const route = read('packages/core/src/types/upstream/route.ts');
const declaration = read('packages/core/src/compiler/scanner/descriptors/route/routeDeclarations.ts');
const packageJson = JSON.parse(read('package.json'));
const checks = [
  [/type RoutePayloadLocationDecision\s*=/.test(vocabulary), 'payload placement has a closed decision algebra'],
  [/kind:\s*'explicit_boundary'/.test(vocabulary) && /kind:\s*'http_method_fallback_policy'/.test(vocabulary), 'explicit evidence is distinguished from method fallback policy'],
  [/policy:\s*'laravel_http_method_payload_convention'/.test(authority), 'fallback policy is explicitly named and provenance-carrying'],
  [/const payloadLocation = payloadLocationDecision\.location/.test(authority), 'scalar payload location is a projection of the decision'],
  [/readonly payloadLocationDecision: RoutePayloadLocationDecision/.test(route), 'route capability contract carries decision provenance'],
  [/payloadLocationDecision: capability\.payloadLocationDecision/.test(inputWiring), 'scanner boundary preserves upstream decision provenance'],
  [/payloadLocationDecision: params\.payloadLocationDecision/.test(builder), 'capability builder composes without reclassification'],
  [/readonly payloadLocationDecision: import\([\s\S]*RoutePayloadLocationDecision/.test(resolution), 'resolved capability exposes the closed decision type'],
  [/readonly payloadLocationDecision: import\([\s\S]*RoutePayloadLocationDecision/.test(boundary), 'resolved boundary contract carries the decision'],
  [/payloadLocationDecision: capability\.payloadLocationDecision/.test(declaration), 'route descriptor projection preserves the same decision'],
  [/routePayloadLocationFromMethod\(input\.method\)/.test(authority), 'legacy convention is confined to upstream authority as an explicit fallback'],
  [packageJson.scripts?.['audit:phase1317-payload-location-evidence'] === 'node scripts/audits/audit-phase1317-payload-location-evidence.cjs', 'package script registers this regression audit'],
];
const failures = checks.filter(([ok]) => !ok).map(([, label]) => label);
const passes = checks.filter(([ok]) => ok).map(([, label]) => label);
const result = { audit: 'phase1317-payload-location-evidence', topology: 'source evidence -> upstream decision + provenance -> wiring -> route contract -> downstream projection', passed: failures.length === 0, passedChecks: passes.length, passes, failures };
process.stdout.write(JSON.stringify(result, null, 2) + '\n');
process.exitCode = failures.length ? 1 : 0;
