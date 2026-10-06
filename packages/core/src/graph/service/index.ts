/**
 * index.ts
 *
 * Sub-domain exports for service graph builder components.
 *
 * @module core/graph/service
 */

export {
  detectExecutionLayer,
  buildServiceNode,
  buildControllerNode,
  buildModelNode
} from './nodeFactories';
export { assembleServiceGraph } from './graphAssembler';
export { compileGraphFromSurface, type GraphBuilderContext } from './manifestGraphCompiler';

export { createGraphEdgeRelation, type GraphEdgeRelation, type GraphEdgeRelationOrigin } from './graphEdgeRelation';
export { GraphEdgeRelationSink } from './graphEdgeRelationSink';

export { projectStructuralSemanticRelationToGraphEdge, type StructuralGraphEdgeProjection } from './structuralSemanticRelationProjection';
