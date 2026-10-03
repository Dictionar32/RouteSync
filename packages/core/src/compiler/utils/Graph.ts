/** Stable relation-native graph facade. */
export type {
  DependencyGraph,
  DependencyEdge
} from './graph/dependencyGraph';
export {
  createDependencyGraph,
  addDependency,
  dependencyForward,
  dependencyReverse,
  dependencyNodes,
  dependencyClosure
} from './graph/dependencyGraph';
export {
  invalidateDependencies,
  stronglyConnectedComponents,
  type GraphUnionFind,
  createGraphUnionFind,
  graphUnionFindUnion
} from './graph/graphAlgorithms';
