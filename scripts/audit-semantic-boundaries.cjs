#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const cli = path.join(root, 'packages', 'cli', 'src');
const core = path.join(root, 'packages', 'core', 'src');

const forbiddenSemanticImplementations = [
  'packages/cli/src/resolvers/IntentResolver.ts',
  'packages/cli/src/resolvers/intent/cartGroupDetector.ts',
  'packages/cli/src/resolvers/intent/cartModelResolver.ts',
  'packages/cli/src/generators/classifier/pathClassifier.ts',
];

const violations = [];
const upstreamContracts = {
  'packages/core/src/types/upstream/semanticCapability.ts': [
    ['SemanticCapabilityAlgebraInterface', 'SemanticCapabilityClosureInterface'],
    ['SemanticCapabilityContractInterface', 'SemanticCapabilityAlgebraInterface'],
  ],
  'packages/core/src/types/upstream/semanticDataflow.ts': [
    ['SemanticDataflowContractInterface', 'SemanticDataflowAlgebraInterface'],
    ['SemanticDataflowInterface', 'SemanticDataflowContractInterface'],
  ],
};
for (const [rel, pairs] of Object.entries(upstreamContracts)) {
  const source = fs.readFileSync(path.join(root, rel), 'utf8');
  for (const [child, parent] of pairs) {
    const childAt = source.indexOf(`interface ${child}`);
    const parentAt = source.indexOf(parent, childAt);
    if (childAt < 0 || parentAt < 0 || parentAt - childAt > 700) {
      violations.push(`${rel}: ${child} must compose ${parent}`);
    }
  }
}

for (const rel of forbiddenSemanticImplementations) {
  const file = path.join(root, rel);
  if (!fs.existsSync(file)) continue;
  const source = fs.readFileSync(file, 'utf8');
  const meaningful = source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '').trim();
  if (meaningful) violations.push(`${rel}: semantic reconstruction surface is not empty`);
}

const boundaryFiles = [
  'packages/core/src/graph/ServiceGraphBuilderInterface.ts',
  'packages/core/src/graph/RouteSyncManifestGraphProjectionInterface.ts',
  'packages/core/src/compiler/scanner/wiring/routeManifestProjectionInterface.ts',
  'packages/core/src/compiler/scanner/wiring/routeManifestTypeLoweringInterface.ts',
  'packages/core/src/compiler/scanner/orchestrator/RouteSyncManifestFlowProjectionInterface.ts',
  'packages/core/src/compiler/analysis/semanticDataflowRuntimeBoundary.ts',
  'packages/core/src/compiler/analysis/routeSyncManifestDataflowProjectionInterface.ts',
];
for (const rel of boundaryFiles) {
  const source = fs.readFileSync(path.join(root, rel), 'utf8');
  if (!source.includes('UpstreamWiringInterface')) violations.push(`${rel}: missing explicit UpstreamWiringInterface`);
  if (source.includes('InterfaceDependencyBoundary')) violations.push(`${rel}: concrete boundary still depends directly on generic InterfaceDependencyBoundary`);
}

const routeProjection = path.join(cli, 'generators', 'classifier', 'routeCapabilityProjectionInterface.ts');
if (fs.existsSync(routeProjection)) {
  const source = fs.readFileSync(routeProjection, 'utf8');
  if (!source.includes('UpstreamWiringInterface<RouteSemanticFlow, ClassifiedRoute>')) {
    violations.push('routeCapabilityProjectionInterface.ts: route lane must specialize UpstreamWiringInterface');
  }
} else {
  violations.push('routeCapabilityProjectionInterface.ts: missing explicit route upstream -> downstream wiring contract');
}

const cliSource = walk(cli);
for (const [file, source] of cliSource) {
  if (file.endsWith('generate.ts') && source.includes('IntentResolver')) violations.push(`${file}: generate command still invokes IntentResolver`);
  if ((file.endsWith('/IntentResolver.ts') || file.endsWith('/cartGroupDetector.ts') || file.endsWith('/cartModelResolver.ts')) && source.replace(/\/\*[\s\S]*?\*\//g, '').trim()) violations.push(`${file}: intent resolver implementation remains`);
}

if (violations.length) {
  console.error(violations.join('\n'));
  process.exit(1);
}
console.log('semantic-boundaries: PASS');

function walk(dir) {
  const out = [];
  for (const entry of fs.readdirSync(dir, {withFileTypes:true})) {
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walk(p));
    else if (entry.name.endsWith('.ts')) out.push([p, fs.readFileSync(p, 'utf8')]);
  }
  return out;
}
