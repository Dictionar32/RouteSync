import type { ClassName, ControllerName } from './names';
import type { SourceSpan } from './provenance';
import type { ControllerMethodAttribute, ControllerMethodContract } from './controller';
import type { ControllerActionFlowContract } from './highLevelContracts';
import type { PhpAstExpressionKind } from './phpAstSyntaxKind';
import type { ResponseShape } from '../domain/responseShapes';
import type { ResponseReference } from './semanticReferences';
import type { PhpClassNameResolutionContext } from './phpClassNameResolutionInterface';

/** Parser-owned return-expression evidence projected into the upstream vocabulary. */
export interface ControllerReturnExpressionEvidence {
  readonly kind: 'controller_return_expression_evidence';
  /** Full return statement source span, including the `return` keyword. */
  readonly source: SourceSpan;
  /** Exact expression source span, kept distinct from the statement span. */
  readonly expressionSource: SourceSpan;
  /** Closed expression syntax vocabulary; no scanner AST object crosses this boundary. */
  readonly expressionKind: PhpAstExpressionKind;
}

/** Lexical context is explicit evidence: unavailable is not an empty namespace/import table. */
export type ControllerResponseAttributeClassNameContextEvidence =
  | Readonly<{ readonly kind: 'available'; readonly context: PhpClassNameResolutionContext }>
  | Readonly<{ readonly kind: 'unavailable'; readonly reason: 'controller_method_lexical_context_missing' }>;

/** Response-attribute syntax evidence is distinct from a resolved response descriptor. */
export type ControllerResponseAttributeSourceEvidence =
  | Readonly<{ readonly kind: 'response_attribute_not_declared' }>
  | Readonly<{
      readonly kind: 'response_attribute_declared';
      readonly response: ResponseReference;
      readonly shape: ResponseShape;
      /** Controller lexical namespace/import inventory required by the PHP class-name authority. */
      readonly classNameResolutionContext: ControllerResponseAttributeClassNameContextEvidence;
      /** Exact PHP attribute provenance; method-level provenance is not substituted. */
      readonly source: SourceSpan;
    }>;

/** Upstream-owned controller declaration evidence. Concrete PHP AST stays in the scanner. */
export interface ControllerMethodEvidence {
  readonly kind: 'controller_method_evidence';
  readonly controller: ControllerName;
  readonly action: ControllerActionFlowContract;
  readonly contract: ControllerMethodContract;
  readonly source: SourceSpan;
  /** Source declaration facts, not a resolved DTO contract or HTTP return judgment. */
  readonly responseAttribute: ControllerResponseAttributeSourceEvidence;
  /** Direct parser observations, independent of descriptor-derived response candidates. */
  readonly returnExpressions: readonly ControllerReturnExpressionEvidence[];
}

export interface ControllerDeclarationEvidence {
  readonly kind: 'controller_declaration_evidence';
  readonly controller: ControllerName;
  readonly attributes: import('./collections').Sequence<ControllerMethodAttribute>;
  readonly inheritedAttributes: import('./collections').Sequence<ControllerMethodAttribute>;
  readonly inheritance: import('./controller').ControllerInheritanceRelation | null;
  readonly interfaces: readonly ClassName[];
  readonly methods: readonly ControllerMethodEvidence[];
  readonly source: SourceSpan;
}
