const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const graphFile = path.join(root, 'packages/core/src/compiler/utils/graph/dependencyGraph.ts');
const graph = fs.readFileSync(graphFile, 'utf8');

const checks = {
  usesRelationExpansionForClosure: /relationExpand\(current, node => dependencyForward\(graph, node\)\)/.test(graph),
  noNestedProjectReturningMembership: !/relationProject\(relationProject\(current, node => dependencyForward/.test(graph),
  usesFixedPointClosure: /relationFixedPoint\(/.test(graph),
  noParsedDescriptorInDomainBase: !/Parsed[A-Za-z]+Descriptor/.test(fs.readFileSync(path.join(root, 'packages/core/src/types/domain/base.ts'), 'utf8')),
};

const allPass = Object.values(checks).every(Boolean);
console.log(JSON.stringify({ phase: 781, file: 'packages/core/src/compiler/utils/graph/dependencyGraph.ts', checks, allPass }, null, 2));
process.exit(allPass ? 0 : 1);
