const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = (relative) => fs.readFileSync(path.join(root, relative), 'utf8');
const checks = [
  ['schema judgment has route-request operation', read('packages/core/src/types/upstream/controllerActionSchemaSemanticJudgmentInterface.ts').includes('forRouteRequest:')],
  ['action contract consumes route-request operation', read('packages/core/src/compiler/scanner/operations/domain-model/request/controllerActionContract.ts').includes('schemaSemanticJudgment.forRouteRequest()')],
  ['controller publication carries canonical judgment', read('packages/core/src/compiler/scanner/wiring/laravelControllerScanner.ts').includes('judgment: semanticJudgment')],
  ['route target is correlated by authority', read('packages/core/src/compiler/scanner/upstream/routeDeclarationComposition.ts').includes('correlationAuthority.judge')],
  ['route reference branch still uses empty schema', read('packages/core/src/compiler/scanner/upstream/routeDeclarationComposition.ts').includes('schema: emptyRouteSchemaPayload()')],
  ['route boundary contract lacks schemaEvidence field', !read('packages/core/src/types/upstream/route.ts').includes('schemaEvidence:')],
  ['serializer preserves endpoint request schema', read('packages/cli/src/generators/ManifestSerializer.ts').includes('schema: serialized.request.body.schema')],
];
for (const [name, passed] of checks) process.stdout.write(`${passed ? 'PASS' : 'FAIL'} ${name}\n`);
const open = checks.filter(([name, passed]) => !passed);
process.stdout.write(`\n${checks.length - open.length}/${checks.length} structural assertions matched the expected audited state.\n`);
process.stdout.write('Note: the expected empty-schema branch is evidence of a known gap, not a successful end-to-end provenance test.\n');
if (open.length) process.exitCode = 1;
