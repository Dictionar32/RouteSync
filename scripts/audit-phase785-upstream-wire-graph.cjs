const fs = require('node:fs');
const path = require('node:path');

const root = process.cwd();
const graphFile = path.join(root, 'packages/core/src/compiler/utils/graph/graphAlgorithms.ts');
const source = fs.readFileSync(graphFile, 'utf8');

const checks = {
  usesCanonicalUnionFind: source.includes("from '../../constraints/UnionFind'"),
  graphUnionFindIsCanonicalAlias: source.includes('export type GraphUnionFind = UnionFind;'),
  usesCanonicalUnionFactory: source.includes('createUnionFind()'),
  usesCanonicalUnionOperation: source.includes('unionFindUnion(state, left, right)'),
  usesRelationExpansionForReach: source.includes('relationExpand(current, value => next(graph, value))'),
  noNestedProjectionForReach: !source.includes('relationProject(relationProject(current'),
  noDuplicateGroupsModel: !source.includes('readonly groups: readonly (readonly number[])[]'),
  noParsedDescriptor: !/Parsed[A-Z]\w*Descriptor/.test(source),
  noForbiddenHostEscape: !/as\s+(?:unknown|any|Extract)/.test(source),
};
checks.allPass = Object.values(checks).every(Boolean);
console.log(JSON.stringify(checks, null, 2));
process.exitCode = checks.allPass ? 0 : 1;
