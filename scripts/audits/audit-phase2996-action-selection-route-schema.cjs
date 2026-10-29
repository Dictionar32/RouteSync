#!/usr/bin/env node
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = (relative) => fs.readFileSync(path.join(root, relative), 'utf8');
const contract = read('packages/core/src/types/upstream/laravelControllerScannerInterface.ts');
const authority = read('packages/core/src/types/upstream/laravelControllerActionRouteCorrelationAuthority.ts');
const composition = read('packages/core/src/compiler/scanner/upstream/routeDeclarationComposition.ts');
const checks = [
  ['selection ADT owns route-schema continuation operation', contract.includes('continueToRouteSchema: () => RouteSchemaPayload')],
  ['matched action projects canonical upstream schema', authority.includes('continueToRouteSchema: () => first.judgment.semantic.schema')],
  ['unmatched action has explicit empty-schema continuation', authority.includes("kind: 'unmatched_action_judgment', continueToRouteSchema: emptyRouteSchemaPayload")],
  ['ambiguous action has explicit empty-schema continuation', authority.includes("kind: 'ambiguous_action_judgments',\n              continueToRouteSchema: emptyRouteSchemaPayload")],
  ['invalid publication has explicit empty-schema continuation', authority.includes("kind: 'invalid_action_judgment_publication', publication: invalid, reason: 'source_span_mismatch', continueToRouteSchema: emptyRouteSchemaPayload")],
  ['controller-reference route boundary consumes selection operation', composition.includes('semanticReturn: { kind: \'absent\' }, schema: actionJudgmentSelection.continueToRouteSchema()')],
  ['controller-reference no longer unconditionally injects empty schema', !/case 'controller_reference':[\s\S]{0,650}schema: emptyRouteSchemaPayload\(\)/.test(composition)],
  ['route-action correlation contract version advanced', authority.includes('contractVersion: 3,')],
];
let failures = 0;
for (const [name, ok] of checks) {
  process.stdout.write(`${ok ? 'PASS' : 'FAIL'} ${name}\n`);
  if (!ok) failures++;
}
process.stdout.write(`RESULT ${checks.length - failures}/${checks.length}\n`);
process.exitCode = failures === 0 ? 0 : 1;
