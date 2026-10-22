import type { ResponseValueContract } from '../domain/responseContracts';
import type { ResponseFieldName } from '../domain/semanticValues';

export type ResponseObservedValueEvidence =
  | Readonly<{ readonly kind: 'literal'; readonly literalKind: 'null' | 'string' | 'number' | 'boolean' }>
  | Readonly<{ readonly kind: 'array'; readonly entries: readonly ResponseObservedArrayEntryEvidence[] }>
  | Readonly<{ readonly kind: 'unsupported' }>;

export type ResponseObservedArrayEntryEvidence =
  | Readonly<{ readonly kind: 'keyed'; readonly name: ResponseFieldName; readonly value: ResponseObservedValueEvidence }>
  | Readonly<{ readonly kind: 'positional'; readonly value: ResponseObservedValueEvidence }>
  | Readonly<{ readonly kind: 'unpacked'; readonly value: ResponseObservedValueEvidence }>;

export type ResponseObservedValueJudgment =
  | Readonly<{ readonly kind: 'resolved'; readonly value: ResponseValueContract }>
  | Readonly<{ readonly kind: 'unsupported_evidence' }>;

export type ResponseValueMergeJudgment =
  | Readonly<{ readonly kind: 'merged'; readonly value: ResponseValueContract }>
  | Readonly<{ readonly kind: 'empty_input' }>;

/**
 * Owns observed-response value inference and contract merging over typed evidence.
 * PHP AST shape extraction belongs to the scanner; semantic value selection belongs here.
 */
export interface ResponseAttributeValueSemanticJudgmentInterface {
  readonly kind: 'response_attribute_value_semantic_judgment_authority';
  readonly judge: (evidence: ResponseObservedValueEvidence) => ResponseObservedValueJudgment;
  readonly merge: (values: readonly ResponseValueContract[]) => ResponseValueMergeJudgment;
}
