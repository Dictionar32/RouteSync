import type { ResourceExpressionModel } from '../domain/resourceExpressionModel';
import type { SourceFile } from './names';

/** Named, provenance-bearing input for the Resource expression mapping operation. */
export interface ResourceAstExpressionMappingInput<SyntaxValue> {
  readonly value: SyntaxValue;
  readonly sourceFile: SourceFile;
}

/**
 * Explicit contract for projecting parsed PHP syntax into the Resource expression model.
 * SyntaxValue is supplied by the syntax owner so upstream does not import scanner-owned AST types.
 */
export interface ResourceAstExpressionMappingOperationInterface<SyntaxValue> {
  (input: ResourceAstExpressionMappingInput<SyntaxValue>): ResourceExpressionModel;
}


/** Upstream owner of Resource expression interpretation and binding-requirement judgment. */
export interface ResourceAstExpressionMappingAuthorityInterface<SyntaxValue> {
  readonly kind: 'resource_ast_expression_mapping_authority';
  readonly contractVersion: 1;
  readonly map: (input: ResourceAstExpressionMappingInput<SyntaxValue>) => ResourceExpressionModel;
}
