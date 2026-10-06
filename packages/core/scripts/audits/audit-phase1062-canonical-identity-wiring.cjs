const fs = require('fs');
const path = require('path');
const root = path.resolve(__dirname, '..', '..');
const read = (p) => fs.readFileSync(path.join(root, p), 'utf8');
const semanticDataflow = read('src/types/upstream/semanticDataflow.ts');
const adapter = read('src/compiler/analysis/semanticDataflowDataFlowAdapter.ts');
const authority = read('src/types/upstream/semanticDataflowAuthority.ts');
const boundary = read('src/compiler/analysis/semanticDataflowRuntimeBoundary.ts');
const upstream = fs.readdirSync(path.join(root, 'src/types/upstream'))
  .filter((name) => name.endsWith('.ts'))
  .map((name) => ({ name, text: read(`src/types/upstream/${name}`) }));

const checks = {
  canonicalIdentityKeyExists: /export const semanticDataflowIdentityKey/.test(semanticDataflow),
  canonicalIdentityEqualityExists: /export const semanticDataflowIdentityEqual/.test(semanticDataflow),
  equalityUsesCanonicalFields: /a\.file\.value === b\.file\.value/.test(semanticDataflow) && /a\.role === b\.role/.test(semanticDataflow) && /a\.slot\.value === b\.slot\.value/.test(semanticDataflow),
  adapterUsesCanonicalEquality: /semanticDataflowIdentityEqual\(fact\.source, source\)/.test(adapter) && /semanticDataflowIdentityEqual\(fact\.target, target\)/.test(adapter),
  adapterDoesNotSerializeIdentityForReachability: !/JSON\.stringify\(semanticDataflowIdentityKey\(fact\.(source|target)\)\)/.test(adapter),
  authorityStillOwnsClosure: /const reachClosure/.test(authority) && /relationFixedPoint/.test(authority),
  runtimeBoundaryRemainsDownstreamOwned: /extends InterfaceDependencyBoundary</.test(boundary) && /SemanticDataflowInput/.test(boundary) && /SemanticDataflowRuntimeDataFlow/.test(boundary),
  upstreamDoesNotImportRuntimeBoundary: upstream.every(({ text }) => !/SemanticDataflowRuntimeBoundary|InterfaceDependencyBoundary|DataFlowProjectionInterface/.test(text)),
};

const passed = Object.values(checks).every(Boolean);
console.log(JSON.stringify({ phase: 1062, checks, passed }, null, 2));
process.exitCode = passed ? 0 : 1;
