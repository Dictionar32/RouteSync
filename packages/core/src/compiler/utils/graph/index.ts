/**
 * index.ts
 *
 * Sub-domain exports for graph utilities and algorithms.
 *
 * @module core/compiler/utils/graph
 */

export { FrozenSet } from './frozenSet';
export {
  type DependencyGraph,
  DependencyGraphBuilder
} from './dependencyGraph';
export {
  IncrementalInvalidator,
  TarjanSCC,
  UnionFind
} from './graphAlgorithms';
