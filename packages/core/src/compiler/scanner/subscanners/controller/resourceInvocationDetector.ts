import type { TokenDescriptor as Token } from '../../lexer/phpAstCoreTypes';
import type { PhpAstValue } from '../../lexer/PhpAst';
import { classifyAstTokens } from '../../lexer/astClassifier';
import { ResourceResponseDescriptor } from '../../../../types/route';
import type { ResourceName } from '../../../../types/upstream/names';
import { SemanticValueFactory } from '../../../../types/domain/semanticValues';
import { relationAdvanceIndex, relationFold, relationGate, relationOptionFold, relationSome, relationNone, type RelationOption } from '../../../../semantic/kernel/relationalSequence';
import { relationAll, relationAny, relationEqual, relationNotEqual } from '../../../../semantic/kernel/semanticRelations';
import { solveRewriteCandidate, requirement } from '../../../../semantic/kernel/requirementSolver';

export interface DetectedResourceInvocation {
  readonly descriptor: ResourceResponseDescriptor;
  readonly resourceName: ResourceName;
  readonly firstArg?: PhpAstValue;
}

type ArgumentState = Readonly<{ readonly started: boolean; readonly complete: boolean; readonly depth: number; readonly argument: readonly Token[] }>;

const skipSpace = (tokens: readonly Token[], index: number): RelationOption<number> =>
  relationGate(index >= tokens.length, () => relationNone(), () =>
    relationGate(relationAny([relationEqual(tokens[index].value, ' '), relationEqual(tokens[index].value, '\n'), relationEqual(tokens[index].value, '\t')]),
      () => skipSpace(tokens, relationAdvanceIndex(index, 1)), () => relationSome(index)));

const advanceArgument = (state: ArgumentState, token: Token): ArgumentState =>
  relationGate(state.complete, () => state, () => relationGate(!state.started,
    () => relationGate(relationAny([relationEqual(token.value, ' '), relationEqual(token.value, '\n'), relationEqual(token.value, '\t')]),
      () => state, () => ({ started: true, complete: false, depth: 0, argument: [token] })),
    () => relationGate(relationAny([relationAll([relationEqual(token.value, ')'), relationEqual(state.depth, 0)]), relationAll([relationEqual(token.value, ','), relationEqual(state.depth, 0)])]),
      () => ({ ...state, complete: true }),
      () => relationGate(relationAny([relationEqual(token.value, '('), relationEqual(token.value, '['), relationEqual(token.value, '{')]),
        () => ({ ...state, depth: state.depth + 1, argument: [...state.argument, token] }),
        () => relationGate(relationAny([relationEqual(token.value, ')'), relationEqual(token.value, ']'), relationEqual(token.value, '}')]),
          () => ({ ...state, depth: state.depth - 1, argument: [...state.argument, token] }),
          () => ({ ...state, argument: [...state.argument, token] }))))));

const extractArgumentOption = (tokens: readonly Token[], openParenIdx: number): RelationOption<PhpAstValue> => {
  const start = relationOptionFold(skipSpace(tokens, relationAdvanceIndex(openParenIdx, 1)), () => tokens.length, value => value);
  const state = relationFold(tokens, { started: false, complete: false, depth: 0, argument: Object.freeze([]) } as ArgumentState,
    (accumulator, token, index) => relationGate(index < start, () => accumulator, () => advanceArgument(accumulator, token)), 0);
  return relationGate(state.argument.length > 0, () => relationSome(classifyAstTokens(state.argument)), () => relationNone());
};

type Invocation = Readonly<{ readonly kind: 'collection' | 'single'; readonly name: string; readonly firstArg: RelationOption<PhpAstValue> }>;

const invocationAt = (tokens: readonly Token[], index: number, hasPaginate: boolean): RelationOption<Invocation> => {
  const token = tokens[index];
  const next = tokens[relationAdvanceIndex(index, 1)];
  const nextNext = tokens[relationAdvanceIndex(index, 2)];
  const after = tokens[relationAdvanceIndex(index, 3)];
  return solveRewriteCandidate([
    { id: 'collection', rewrite: () => ({ kind: 'collection', name: token.value, firstArg: relationGate(relationEqual(after?.value, '('), () => extractArgumentOption(tokens, relationAdvanceIndex(index, 3)), () => relationNone()) }), requirements: [requirement('identifier', relationEqual(token?.type, 'IDENTIFIER')), requirement('scope', relationEqual(next?.value, '::')), requirement('operation', relationEqual(nextNext?.value, 'collection'))] },
    { id: 'make', rewrite: () => ({ kind: 'single', name: token.value, firstArg: relationGate(relationEqual(after?.value, '('), () => extractArgumentOption(tokens, relationAdvanceIndex(index, 3)), () => relationNone()) }), requirements: [requirement('identifier', relationEqual(token?.type, 'IDENTIFIER')), requirement('scope', relationEqual(next?.value, '::')), requirement('operation', relationEqual(nextNext?.value, 'make'))] },
    { id: 'new', rewrite: () => ({ kind: relationGate(relationAny([relationGate(Object.is(typeof next?.value, 'string'), () => next.value.endsWith('Collection'), () => false), hasPaginate]), () => 'collection', () => 'single'), name: relationOptionFold(relationGate(Object.is(typeof next?.value, 'string'), () => relationSome(next.value), () => relationNone()), () => '', value => value), firstArg: relationGate(relationEqual(tokens[relationAdvanceIndex(index, 2)]?.value, '('), () => extractArgumentOption(tokens, relationAdvanceIndex(index, 2)), () => relationNone()) }), requirements: [requirement('new', relationEqual(token?.value, 'new')), requirement('identifier', relationEqual(next?.type, 'IDENTIFIER')), requirement('resource-name', relationAny([relationGate(Object.is(typeof next?.value, 'string'), () => next.value.endsWith('Resource'), () => false), relationGate(Object.is(typeof next?.value, 'string'), () => next.value.endsWith('Collection'), () => false), relationGate(Object.is(typeof next?.value, 'string'), () => relationAll([next.value.length > 2, relationEqual(next.value.charAt(0), next.value.charAt(0).toUpperCase())]), () => false)]))] },
  ]);
};

const scanInvocation = (tokens: readonly Token[], index: number, end: number, hasPaginate: boolean): RelationOption<Invocation> =>
  relationGate(index >= end, () => relationNone(), () => relationOptionFold(invocationAt(tokens, index, hasPaginate),
    () => scanInvocation(tokens, relationAdvanceIndex(index, 1), end, hasPaginate), value => relationSome(value)));

export function detectResourceInvocation(tokens: readonly Token[], k: number) {
  const end = relationFold(tokens, tokens.length, (accumulator, token, index) => relationGate(relationAll([index > k, index < accumulator, relationEqual(token.value, ';')]), () => index, () => accumulator), k);
  const hasPaginate = relationFold(tokens, false, (accumulator, token, index) => relationGate(index < end,
    () => relationAny([accumulator, relationEqual(token.value, 'paginate'), relationEqual(token.value, 'simplePaginate')]), () => accumulator), relationAdvanceIndex(k, 1));
  const candidate = relationGate(relationEqual(tokens[k]?.value, 'return'), () => scanInvocation(tokens, relationAdvanceIndex(k, 1), end, hasPaginate), () => relationNone());
  return relationOptionFold(candidate, () => { return; }, value => {
    const resourceName = SemanticValueFactory.resourceName(value.name);
    return { descriptor: ResourceResponseDescriptor.create({ resourceName, shape: value.kind }), resourceName, ...relationOptionFold(value.firstArg, () => ({}), firstArg => ({ firstArg })) };
  });
}
