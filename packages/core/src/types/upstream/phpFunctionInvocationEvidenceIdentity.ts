import type { FunctionName } from './names';
import type { SourceSpan } from './provenance';
import { sourceSpanOperations } from './provenance';
import type { PhpFunctionNameSyntaxEvidence } from './phpFunctionNameResolutionInterface';

/** One name segment retains both its typed name and the source location that proves it. */
export interface PhpFunctionInvocationNameSegmentIdentity {
  readonly kind: 'php_function_invocation_name_segment_identity';
  readonly name: FunctionName;
  readonly source: SourceSpan;
}

/** A name identity retains lexical segments and their provenance; it is never flattened to a delimiter key. */
export type PhpFunctionInvocationNameIdentity =
  | Readonly<{
      readonly kind: 'named_php_function_invocation_identity';
      readonly segments: readonly PhpFunctionInvocationNameSegmentIdentity[];
    }>
  | Readonly<{
      readonly kind: 'malformed_php_function_invocation_identity';
      readonly reason: 'missing_name_segment' | 'invalid_separator_sequence';
      readonly source: SourceSpan;
    }>;

/** Typed identity for duplicate invocation evidence; source and name evidence stay separately inspectable. */
export interface PhpFunctionInvocationEvidenceIdentity {
  readonly kind: 'php_function_invocation_evidence_identity';
  readonly source: SourceSpan;
  readonly name: PhpFunctionInvocationNameIdentity;
}

export type PhpFunctionInvocationEvidenceIdentityEquality =
  | Readonly<{ readonly kind: 'same_php_function_invocation_evidence_identity' }>
  | Readonly<{ readonly kind: 'different_php_function_invocation_evidence_identity' }>;

export interface PhpFunctionInvocationEvidenceIdentityOperationsInterface {
  readonly create: (source: SourceSpan, syntax: PhpFunctionNameSyntaxEvidence) => PhpFunctionInvocationEvidenceIdentity;
  readonly same: (left: PhpFunctionInvocationEvidenceIdentity, right: PhpFunctionInvocationEvidenceIdentity) => PhpFunctionInvocationEvidenceIdentityEquality;
}

const segmentIdentity = (name: FunctionName, source: SourceSpan): PhpFunctionInvocationNameSegmentIdentity => Object.freeze({
  kind: 'php_function_invocation_name_segment_identity',
  name,
  source,
});

const nameIdentity = (syntax: PhpFunctionNameSyntaxEvidence): PhpFunctionInvocationNameIdentity => {
  switch (syntax.kind) {
    case 'unqualified_function_name_evidence':
      return Object.freeze({ kind: 'named_php_function_invocation_identity', segments: Object.freeze([segmentIdentity(syntax.segment.name, syntax.segment.source)]) });
    case 'qualified_function_name_evidence':
    case 'fully_qualified_function_name_evidence':
      return Object.freeze({ kind: 'named_php_function_invocation_identity', segments: Object.freeze(syntax.segments.map(segment => segmentIdentity(segment.name, segment.source))) });
    case 'malformed_function_name_evidence':
      return Object.freeze({ kind: 'malformed_php_function_invocation_identity', reason: syntax.reason, source: syntax.source });
  }
};

const sameNameSegment = (left: PhpFunctionInvocationNameSegmentIdentity, right: PhpFunctionInvocationNameSegmentIdentity): boolean =>
  left.name.value.value === right.name.value.value
  && sourceSpanOperations.same(left.source, right.source).kind === 'same_source_span';

const sameName = (left: PhpFunctionInvocationNameIdentity, right: PhpFunctionInvocationNameIdentity): boolean => {
  if (left.kind !== right.kind) return false;
  switch (left.kind) {
    case 'malformed_php_function_invocation_identity':
      return right.kind === 'malformed_php_function_invocation_identity'
        && left.reason === right.reason
        && sourceSpanOperations.same(left.source, right.source).kind === 'same_source_span';
    case 'named_php_function_invocation_identity':
      return right.kind === 'named_php_function_invocation_identity'
        && left.segments.length === right.segments.length
        && left.segments.every((segment, index) => {
          const candidate = right.segments[index];
          return candidate !== undefined && sameNameSegment(segment, candidate);
        });
  }
};

export const phpFunctionInvocationEvidenceIdentityOperations: PhpFunctionInvocationEvidenceIdentityOperationsInterface = Object.freeze({
  create: (source: SourceSpan, syntax: PhpFunctionNameSyntaxEvidence): PhpFunctionInvocationEvidenceIdentity => Object.freeze({
    kind: 'php_function_invocation_evidence_identity',
    source,
    name: nameIdentity(syntax),
  }),
  same: (left: PhpFunctionInvocationEvidenceIdentity, right: PhpFunctionInvocationEvidenceIdentity): PhpFunctionInvocationEvidenceIdentityEquality =>
    sourceSpanOperations.same(left.source, right.source).kind === 'same_source_span' && sameName(left.name, right.name)
      ? Object.freeze({ kind: 'same_php_function_invocation_evidence_identity' as const })
      : Object.freeze({ kind: 'different_php_function_invocation_evidence_identity' as const }),
});
