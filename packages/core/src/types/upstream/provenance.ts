import type { NumberValue } from './valueObjects';
import type { SourceFile, TableName } from './names';

/** Source offsets remain parser-boundary evidence; their meaning is owned by SourceSpan operations. */
export interface SourceSpan {
  readonly kind: 'source_span';
  readonly file: SourceFile;
  readonly start: NumberValue;
  readonly end: NumberValue;
}

export type SourceSpanEquality =
  | Readonly<{ readonly kind: 'same_source_span' }>
  | Readonly<{ readonly kind: 'different_source_span' }>;

export type SourceSpanValidity =
  | Readonly<{ readonly kind: 'source_span_ordered' }>
  | Readonly<{ readonly kind: 'source_span_negative_start' }>
  | Readonly<{ readonly kind: 'source_span_empty' }>
  | Readonly<{ readonly kind: 'source_span_reversed_bounds' }>;

export type SourceSpanContainment =
  | Readonly<{ readonly kind: 'source_span_contained' }>
  | Readonly<{ readonly kind: 'source_span_not_contained' }>;

export type SourceSpanDocumentCoverage =
  | Readonly<{ readonly kind: 'source_span_covers_document' }>
  | Readonly<{ readonly kind: 'source_span_does_not_cover_document' }>;

export type SourceSpanOverlap =
  | Readonly<{ readonly kind: 'source_span_overlapping' }>
  | Readonly<{ readonly kind: 'source_span_disjoint' }>
  | Readonly<{ readonly kind: 'source_span_overlap_invalid' }>;

export interface SourceSpanOperationsInterface {
  readonly same: (left: SourceSpan, right: SourceSpan) => SourceSpanEquality;
  readonly validate: (span: SourceSpan) => SourceSpanValidity;
  readonly validateNonEmpty: (span: SourceSpan) => SourceSpanValidity;
  readonly contains: (outer: SourceSpan, inner: SourceSpan) => SourceSpanContainment;
  readonly overlaps: (left: SourceSpan, right: SourceSpan) => SourceSpanOverlap;
  readonly coversDocument: (span: SourceSpan, documentLength: NumberValue) => SourceSpanDocumentCoverage;
}

export interface SourceSpanFactoryInterface {
  readonly create: (file: SourceFile, start: NumberValue, end: NumberValue) => SourceSpan;
}

export const sourceSpanFactory: SourceSpanFactoryInterface = Object.freeze({
  create: (file: SourceFile, start: NumberValue, end: NumberValue): SourceSpan => Object.freeze({
    kind: 'source_span' as const,
    file,
    start,
    end,
  }),
});

/** Central semantic operations prevent each upstream consumer from re-implementing span arithmetic. */
export const sourceSpanOperations: SourceSpanOperationsInterface = Object.freeze({
  same: (left: SourceSpan, right: SourceSpan): SourceSpanEquality =>
    left.file.value.value === right.file.value.value
      && left.start.value === right.start.value
      && left.end.value === right.end.value
      ? Object.freeze({ kind: 'same_source_span' as const })
      : Object.freeze({ kind: 'different_source_span' as const }),
  validate: (span: SourceSpan): SourceSpanValidity => {
    if (span.start.value < 0) return Object.freeze({ kind: 'source_span_negative_start' as const });
    if (span.end.value < span.start.value) return Object.freeze({ kind: 'source_span_reversed_bounds' as const });
    return Object.freeze({ kind: 'source_span_ordered' as const });
  },
  validateNonEmpty: (span: SourceSpan): SourceSpanValidity => {
    if (span.start.value < 0) return Object.freeze({ kind: 'source_span_negative_start' as const });
    if (span.end.value < span.start.value) return Object.freeze({ kind: 'source_span_reversed_bounds' as const });
    if (span.end.value === span.start.value) return Object.freeze({ kind: 'source_span_empty' as const });
    return Object.freeze({ kind: 'source_span_ordered' as const });
  },
  contains: (outer: SourceSpan, inner: SourceSpan): SourceSpanContainment => {
    const outerValidity = sourceSpanOperations.validate(outer);
    const innerValidity = sourceSpanOperations.validate(inner);
    const sameFile = outer.file.value.value === inner.file.value.value;
    const outerHasValidBounds = outerValidity.kind === 'source_span_ordered' || outerValidity.kind === 'source_span_empty';
    const innerHasValidBounds = innerValidity.kind === 'source_span_ordered' || innerValidity.kind === 'source_span_empty';
    const bounded = inner.start.value >= outer.start.value && inner.end.value <= outer.end.value;
    return sameFile && outerHasValidBounds && innerHasValidBounds && bounded
      ? Object.freeze({ kind: 'source_span_contained' as const })
      : Object.freeze({ kind: 'source_span_not_contained' as const });
  },
  overlaps: (left: SourceSpan, right: SourceSpan): SourceSpanOverlap => {
    const leftValidity = sourceSpanOperations.validateNonEmpty(left);
    const rightValidity = sourceSpanOperations.validateNonEmpty(right);
    const leftIsValid = leftValidity.kind === 'source_span_ordered';
    const rightIsValid = rightValidity.kind === 'source_span_ordered';
    if (!leftIsValid || !rightIsValid) return Object.freeze({ kind: 'source_span_overlap_invalid' as const });
    if (left.file.value.value !== right.file.value.value) return Object.freeze({ kind: 'source_span_disjoint' as const });
    return left.start.value < right.end.value && right.start.value < left.end.value
      ? Object.freeze({ kind: 'source_span_overlapping' as const })
      : Object.freeze({ kind: 'source_span_disjoint' as const });
  },
  coversDocument: (span: SourceSpan, documentLength: NumberValue): SourceSpanDocumentCoverage =>
    span.start.value === 0 && span.end.value === documentLength.value
      ? Object.freeze({ kind: 'source_span_covers_document' as const })
      : Object.freeze({ kind: 'source_span_does_not_cover_document' as const }),
});

/** Semantic provenance for upstream migration evidence; deliberately excludes MigrationAst. */
export type MigrationOperationProvenance = Readonly<{
  readonly kind: 'migration_operation_provenance';
  readonly operation: 'create_table' | 'alter_table' | 'drop_table' | 'raw';
  readonly table?: TableName;
  readonly index: NumberValue;
}>;

export type MigrationProvenance = Readonly<{
  readonly kind: 'migration_provenance';
  readonly source: SourceSpan;
  readonly operation: MigrationOperationProvenance;
}>;

