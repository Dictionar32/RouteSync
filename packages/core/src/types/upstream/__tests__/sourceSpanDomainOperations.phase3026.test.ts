import { describe, expect, it } from 'vitest';
import { sourceFileIdentityFactory } from '../names';
import { sourceSpanFactory, sourceSpanOperations } from '../provenance';
import { numberValue, stringValue } from '../valueObjects';

const file = sourceFileIdentityFactory.create(stringValue.create('app/Http/Controllers/UserController.php'));
const otherFile = sourceFileIdentityFactory.create(stringValue.create('app/Http/Controllers/OtherController.php'));
const span = (start: number, end: number, sourceFile = file) => sourceSpanFactory.create(sourceFile, numberValue(start), numberValue(end));

describe('source span domain operations — phase 3026', () => {
  it('returns explicit equality judgments', () => {
    expect(sourceSpanOperations.same(span(2, 8), span(2, 8))).toEqual({ kind: 'same_source_span' });
    expect(sourceSpanOperations.same(span(2, 8), span(3, 8))).toEqual({ kind: 'different_source_span' });
  });

  it('classifies source-boundary validity without leaking offset arithmetic to consumers', () => {
    expect(sourceSpanOperations.validate(span(0, 0))).toEqual({ kind: 'source_span_ordered' });
    expect(sourceSpanOperations.validate(span(8, 2))).toEqual({ kind: 'source_span_reversed_bounds' });
    expect(sourceSpanOperations.validate(span(-1, 2))).toEqual({ kind: 'source_span_negative_start' });
    expect(sourceSpanOperations.validateNonEmpty(span(0, 0))).toEqual({ kind: 'source_span_empty' });
  });

  it('judges containment and complete document coverage as domain outcomes', () => {
    expect(sourceSpanOperations.contains(span(0, 20), span(3, 8))).toEqual({ kind: 'source_span_contained' });
    expect(sourceSpanOperations.contains(span(0, 5), span(3, 8))).toEqual({ kind: 'source_span_not_contained' });
    expect(sourceSpanOperations.coversDocument(span(0, 20), numberValue(20))).toEqual({ kind: 'source_span_covers_document' });
    expect(sourceSpanOperations.coversDocument(span(1, 20), numberValue(20))).toEqual({ kind: 'source_span_does_not_cover_document' });
  });

  it('judges half-open source overlap through the domain operation', () => {
    expect(sourceSpanOperations.overlaps(span(0, 5), span(4, 9))).toEqual({ kind: 'source_span_overlapping' });
    expect(sourceSpanOperations.overlaps(span(0, 5), span(5, 9))).toEqual({ kind: 'source_span_disjoint' });
    expect(sourceSpanOperations.overlaps(span(0, 5), span(0, 5, otherFile))).toEqual({ kind: 'source_span_disjoint' });
    expect(sourceSpanOperations.overlaps(span(3, 3), span(0, 5))).toEqual({ kind: 'source_span_overlap_invalid' });
  });
});
