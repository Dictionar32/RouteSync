import type { ExpressionAst } from './ast';
import type { AssignmentAst } from './assignment';
import type { PropertyAst } from './property';
import type { SourceProjectIdentity } from './highLevelSourceModel';

export type SourceAstSemanticProducts = Readonly<{
  readonly expressions: readonly ExpressionAst[];
  readonly assignments: readonly AssignmentAst[];
  readonly properties: readonly PropertyAst[];
}>;

/**
 * Closed upstream boundary for semantic products derived from parsed Laravel source.
 * The scanner orchestrator transports these products; it does not choose semantic producers.
 */
export interface SourceAstSemanticProducerInterface {
  readonly kind: 'source_ast_semantic_producer';
  readonly closed: true;
  produce(sourceProject: SourceProjectIdentity): Promise<SourceAstSemanticProducts>;
}
