import type { AttributeAst } from '../../types/upstream/ast';
import type { LaravelAttributeContextualityJudgment } from '../../types/upstream/laravelAttributeScannerInterface';
import type { SourceSpan } from '../../types/upstream/provenance';
import type { ControllerDeclarationAst } from '../frontend/php/controllerAstTypes';
import type { PhpAstValue } from '../frontend/php/phpAstExpressionTypes';
import type { PhpAstExpressionSemanticAuthorityInterface } from '../../types/upstream/phpAstExpressionSemanticAuthorityInterface';
import type { PhpClassConstructorSelectionAuthorityInterface } from '../../types/upstream/phpClassConstructorSelectionInterface';

/**
 * Complete parsed syntax and upstream contextuality judgment admitted by the
 * canonical attribute-AST producer. This contract intentionally lives at the
 * scanner boundary: ControllerDeclarationAst is compiler syntax, so exporting
 * it from `types/upstream` would reverse the dependency direction.
 */
export interface AttributeProducerInput {
  readonly declaration: ControllerDeclarationAst<false>;
  readonly source: SourceSpan;
  readonly contextuality: LaravelAttributeContextualityJudgment;
  readonly expressionAuthority: PhpAstExpressionSemanticAuthorityInterface<PhpAstValue>;
  readonly constructorSelectionAuthority: PhpClassConstructorSelectionAuthorityInterface;
}

/** A producer failure is a typed judgment, never an exception-shaped control-flow contract. */
export type AttributeProducerBlocker =
  | Readonly<{ readonly kind: 'attribute_producer_constructor_missing'; readonly declarationSource: SourceSpan }>
  | Readonly<{ readonly kind: 'attribute_producer_constructor_ambiguous'; readonly declarationSource: SourceSpan; readonly candidates: readonly SourceSpan[] }>
  | Readonly<{ readonly kind: 'attribute_producer_constructor_inventory_blocked'; readonly declarationSource: SourceSpan; readonly blockers: readonly SourceSpan[] }>;

export type AttributeProducerJudgment =
  | Readonly<{
      readonly kind: 'attribute_producer_complete';
      readonly attribute: AttributeAst;
    }>
  | Readonly<{
      readonly kind: 'attribute_producer_blocked';
      readonly blocker: AttributeProducerBlocker;
    }>;

/**
 * Structural AST projection only. File discovery, source reading, parsing,
 * PHP name resolution, and scan completeness belong to the scanner contract.
 * Missing constructor is a domain outcome; it must not be hidden in a thrown Error.
 */
export interface AttributeProducerInterface {
  readonly kind: 'attribute_producer';
  readonly closed: true;
  readonly contractVersion: 5;
  readonly produce: (input: AttributeProducerInput) => AttributeProducerJudgment;
}

