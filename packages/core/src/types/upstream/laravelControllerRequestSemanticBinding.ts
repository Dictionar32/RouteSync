import type { FormRequestSource } from '../domain/request';
import type { ClassName } from './names';
import type { TypeExpression } from './typeVocabulary';
import type { PhpParameterTypeJudgment } from './phpParameterTypeInterface';

/** Failed type resolution remains a failed judgment; it must not become a successful TypeExpression error node. */
export type UnresolvedPhpParameterTypeJudgment = Exclude<PhpParameterTypeJudgment, Readonly<{ readonly kind: 'resolved'; readonly expression: TypeExpression }>>;

/**
 * Canonical controller-level request binding knowledge.
 * This is deliberately distinct from route-level request binding, whose resource
 * identity is not known at the controller declaration boundary.
 */
export type LaravelControllerRequestSemanticBinding =
  | Readonly<{ readonly kind: 'no_request' }>
  | Readonly<{ readonly kind: 'form_request'; readonly source: FormRequestSource }>
  | Readonly<{ readonly kind: 'framework_request'; readonly type: ClassName }>
  | Readonly<{ readonly kind: 'typed'; readonly type: TypeExpression }>
  | Readonly<{ readonly kind: 'typed_unresolved'; readonly judgment: UnresolvedPhpParameterTypeJudgment }>;
