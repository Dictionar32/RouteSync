import type { Expression } from './expression';
import type { Option } from './collections';
import type { SourceFile } from './names';
import type { PhpTypeClassContext } from './phpTypeAtomInterface';

/**
 * PHP AST evidence is supplied by the source frontend. The upstream contract
 * deliberately treats that evidence as opaque so upstream never imports a
 * compiler/scanner implementation type.
 */
export type PhpAstExpressionSemanticInput<Evidence> = Readonly<{
  readonly kind: 'php_ast_expression_evidence';
  readonly evidence: Evidence;
  readonly sourceFile: SourceFile;
  readonly classContext: Option<PhpTypeClassContext>;
}>;

/**
 * Expression is already RouteSync's closed semantic ADT, including its explicit
 * unsupported_expression case. Do not wrap it in a second status discriminator.
 */
export type PhpAstExpressionSemanticJudgment = Expression;

/** Upstream-owned authority contract for PHP expression evidence derivation. */
export interface PhpAstExpressionSemanticAuthorityInterface<Evidence> {
  readonly kind: 'php_ast_expression_semantic_authority';
  readonly derive: (input: PhpAstExpressionSemanticInput<Evidence>) => PhpAstExpressionSemanticJudgment;
}
