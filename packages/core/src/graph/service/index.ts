/**
 * index.ts
 *
 * Sub-domain exports for service graph builder components.
 *
 * @module core/graph/service
 */

export { graphNodeFactoryOperations, type GraphNodeFactoryOperationsInterface } from './nodeFactories';
export { serviceGraphAssemblyOperations, type ServiceGraphAssemblyOperationsInterface } from './graphAssembler';
export { manifestGraphCompilationOperations, type ManifestGraphCompilationOperationsInterface, type GraphBuilderContext } from './manifestGraphCompiler';

export { graphEdgeRelationOperations, type GraphEdgeRelationOperationsInterface, type GraphEdgeRelation, type GraphEdgeRelationOrigin } from './graphEdgeRelation';
export { GraphEdgeRelationSink } from './graphEdgeRelationSink';

export { structuralSemanticRelationProjectionOperations, type StructuralSemanticRelationProjectionOperationsInterface, type StructuralGraphEdgeProjection } from './structuralSemanticRelationProjection';
