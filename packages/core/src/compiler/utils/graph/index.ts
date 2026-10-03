/** Relation-native dependency graph surface. */
export {
  type DependencyGraph,
  type DependencyEdge,
  createDependencyGraph,
  addDependency,
  dependencyForward,
  dependencyReverse,
  dependencyNodes,
  dependencyClosure
} from './dependencyGraph';
export {
  invalidateDependencies,
  stronglyConnectedComponents,
  type GraphUnionFind,
  createGraphUnionFind,
  graphUnionFindUnion
} from './graphAlgorithms';
