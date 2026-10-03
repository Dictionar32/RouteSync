/**
 * index.ts
 *
 * Sub-domain exports for compiler pass graph analyzer and sorter.
 *
 * @module core/compiler/passes/graph
 */

export {
  type GraphAnalysis,
  type AdjacencyRelation,
  buildAdjacency,
  analyzePassGraph
} from './graphAnalyzer';
export {
  resolveTopologicalOrder,
  resolveParallelLayers
} from './topologicalSorter';
