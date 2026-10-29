import { relationEqual, relationResolve } from '../../../../semantic/relations/semanticRelations';
import { relationFirstOption, relationOptionFold, relationRefine, relationSlice, type RelationOption } from '../../../../semantic/relations/relationalSequence';

export type DelimiterToken = '(' | ')' | '[' | ']' | '{' | '}';
type OpeningDelimiter = '(' | '[' | '{';
type ClosingDelimiter = ')' | ']' | '}';
export type DelimiterInput = RelationOption<string>;

type DelimiterRelation =
  | { readonly kind: 'opening'; readonly token: OpeningDelimiter; readonly close: ClosingDelimiter }
  | { readonly kind: 'closing'; readonly token: ClosingDelimiter; readonly open: OpeningDelimiter }
  | { readonly kind: 'other' };
type MappedDelimiterRelation = Exclude<DelimiterRelation, { readonly kind: 'other' }>;

const DELIMITER_RELATIONS: readonly MappedDelimiterRelation[] = Object.freeze([
  { kind: 'opening', token: '(', close: ')' },
  { kind: 'opening', token: '[', close: ']' },
  { kind: 'opening', token: '{', close: '}' },
  { kind: 'closing', token: ')', open: '(' },
  { kind: 'closing', token: ']', open: '[' },
  { kind: 'closing', token: '}', open: '{' },
]);

const relationOf = (input: DelimiterInput): DelimiterRelation =>
  relationOptionFold(
    input,
    () => ({ kind: 'other' }),
    value => relationOptionFold(
      relationFirstOption(DELIMITER_RELATIONS, relation => relationEqual(relation.token, value)),
      () => ({ kind: 'other' }),
      relation => relation,
    ),
  );

const isOpeningRelation = (relation: DelimiterRelation): relation is Extract<DelimiterRelation, { readonly kind: 'opening' }> =>
  Object.freeze({ opening: true, closing: false, other: false })[relation.kind];
const isClosingRelation = (relation: DelimiterRelation): relation is Extract<DelimiterRelation, { readonly kind: 'closing' }> =>
  Object.freeze({ opening: false, closing: true, other: false })[relation.kind];


export type DelimiterBoundary = 'top_level' | 'nested';
export interface DelimiterState {
  readonly stack: readonly DelimiterToken[];
  readonly boundary: DelimiterBoundary;
}

export interface EmptyDelimiterStateFactoryInterface {
  readonly create: () => DelimiterState;
}

export const emptyDelimiterStateFactory: EmptyDelimiterStateFactoryInterface = Object.freeze({
  create: (): DelimiterState => Object.freeze({ stack: Object.freeze([]), boundary: 'top_level' }),
});

const boundaryOf = (stack: readonly DelimiterToken[]): DelimiterBoundary =>
  relationResolve(relationEqual(stack.length, 0), () => 'top_level', () => 'nested');

const stackAfterClose = (state: DelimiterState, relation: Extract<DelimiterRelation, { readonly kind: 'closing' }>): readonly DelimiterToken[] => {
  const top = state.stack[state.stack.length - 1];
  return relationResolve(relationEqual(top, relation.open), () => relationSlice(state.stack, 0, state.stack.length - 1), () => state.stack);
};

const transitionOpening = (state: DelimiterState, relation: Extract<DelimiterRelation, { readonly kind: 'opening' }>): DelimiterState =>
  Object.freeze({ stack: Object.freeze([...state.stack, relation.token]), boundary: 'nested' });
const transitionClosing = (state: DelimiterState, relation: Extract<DelimiterRelation, { readonly kind: 'closing' }>): DelimiterState => {
  const stack = stackAfterClose(state, relation);
  return Object.freeze({ stack, boundary: boundaryOf(stack) });
};
const transitionOther = (state: DelimiterState): DelimiterState => state;


export interface DelimiterTransitionOperationInterface {
  readonly advance: (state: DelimiterState, input: DelimiterInput) => DelimiterState;
}

export const delimiterTransitionOperation: DelimiterTransitionOperationInterface = Object.freeze({
  advance: (state: DelimiterState, input: DelimiterInput): DelimiterState => {
    const relation = relationOf(input);
    return relationOptionFold(relationRefine(relation, isOpeningRelation), () => relationOptionFold(relationRefine(relation, isClosingRelation), () => transitionOther(state), value => transitionClosing(state, value)), value => transitionOpening(state, value));
  },
});

export interface TopLevelDelimiterPredicateOperationInterface {
  readonly test: (state: DelimiterState) => boolean;
}
export const isTopLevelDelimiterOperation: TopLevelDelimiterPredicateOperationInterface = Object.freeze({
  test: (state: DelimiterState): boolean => relationEqual(state.boundary, 'top_level'),
});

export interface OpeningDelimiterPredicateOperationInterface {
  readonly test: (input: DelimiterInput) => boolean;
}
export const isOpeningDelimiterOperation: OpeningDelimiterPredicateOperationInterface = Object.freeze({
  test: (input: DelimiterInput): boolean => relationEqual(relationOf(input).kind, 'opening'),
});

export interface ClosingDelimiterPredicateOperationInterface {
  readonly test: (input: DelimiterInput) => boolean;
}
export const isClosingDelimiterOperation: ClosingDelimiterPredicateOperationInterface = Object.freeze({
  test: (input: DelimiterInput): boolean => relationEqual(relationOf(input).kind, 'closing'),
});

export interface CurrentDelimiterClosureOperationInterface {
  readonly test: (state: DelimiterState, input: DelimiterInput) => boolean;
}
export const closesCurrentDelimiterOperation: CurrentDelimiterClosureOperationInterface = Object.freeze({
  test: (state: DelimiterState, input: DelimiterInput): boolean => {
    const relation = relationOf(input);
    return relationOptionFold(relationRefine(relation, isClosingRelation), () => false, value => relationEqual(state.stack[state.stack.length - 1], value.open));
  },
});

export interface DelimiterDepthOperationInterface {
  readonly measure: (state: DelimiterState) => number;
}
export const delimiterDepthOperation: DelimiterDepthOperationInterface = Object.freeze({
  measure: (state: DelimiterState): number => state.stack.length,
});

export interface MatchingDelimiterCloseOperationInterface {
  readonly resolve: (input: DelimiterInput) => RelationOption<string>;
}
export const matchingDelimiterCloseOperation: MatchingDelimiterCloseOperationInterface = Object.freeze({
  resolve: (input: DelimiterInput): RelationOption<string> => {
    const relation = relationOf(input);
    return relationOptionFold(relationRefine(relation, isOpeningRelation), () => ({ kind: 'none' }), value => ({ kind: 'some', value: value.close }));
  },
});
