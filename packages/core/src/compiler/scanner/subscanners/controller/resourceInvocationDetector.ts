import type { TokenDescriptor as Token } from '../../lexer/phpAstCoreTypes';
import type { PhpAstValue } from '../../lexer/PhpAst';
import { classifyAstTokens } from '../../lexer/astClassifier';
import { ResourceResponseDescriptor } from '../../../../types/route';
import type { ResourceName } from '../../../../types/upstream/names';
import { SemanticValueFactory } from '../../../../types/domain/semanticValues';
import { relationAdvanceIndex, relationFold, relationGate, relationOptionFold, relationSome, relationNone, type RelationOption } from '../../../../semantic/kernel/relationalSequence';
import { tokenKindAt, tokenValueAt } from '../../lexer/tokenEvidence';
import { relationAll, relationAny, relationEqual, relationNotEqual } from '../../../../semantic/kernel/semanticRelations';
import { solveRewriteCandidate, requirement } from '../../../../semantic/kernel/semanticDecisionRewriteEngine';

export interface DetectedResourceInvocation {
  readonly descriptor: ResourceResponseDescriptor;
  readonly resourceName: ResourceName;
  readonly firstArg: RelationOption<PhpAstValue>;
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
  const state = relationFold(tokens, { started: false, complete: false, depth: 0, argument: Object.freeze([]) } satisfies ArgumentState,
    (accumulator, token, index) => relationGate(index < start, () => accumulator, () => advanceArgument(accumulator, token)), 0);
  return relationGate(state.argument.length > 0, () => relationSome(classifyAstTokens(state.argument)), () => relationNone());
};

type Invocation = Readonly<{ readonly kind: 'collection' | 'single'; readonly name: string; readonly firstArg: RelationOption<PhpAstValue> }>;

const invocationAt = (tokens: readonly Token[], index: number, hasPaginate: boolean): RelationOption<Invocation> => {
  const identifier = relationOptionFold(tokenValueAt(tokens, index), () => '', value => value);
  const identifierKind = relationOptionFold(tokenKindAt(tokens, index), () => '', value => value);
  const scope = relationOptionFold(tokenValueAt(tokens, relationAdvanceIndex(index, 1)), () => '', value => value);
  const operation = relationOptionFold(tokenValueAt(tokens, relationAdvanceIndex(index, 2)), () => '', value => value);
  const after = relationOptionFold(tokenValueAt(tokens, relationAdvanceIndex(index, 3)), () => '', value => value);
  const resourceName = relationOptionFold(tokenValueAt(tokens, relationAdvanceIndex(index, 1)), () => '', value => value);
  const newKind = relationGate(
    relationAny([
      relationGate(resourceName.endsWith('Collection'), () => true, () => false),
      hasPaginate,
    ]),
    () => 'collection' as const,
    () => 'single' as const,
  );
  const newName = resourceName;
  const collectionArgument = relationGate(relationEqual(after, '('), () => extractArgumentOption(tokens, relationAdvanceIndex(index, 3)), () => relationNone());
  const newArgument = relationGate(relationEqual(operation, '('), () => extractArgumentOption(tokens, relationAdvanceIndex(index, 2)), () => relationNone());
  const resourceNameValid = relationAny([
    resourceName.endsWith('Resource'),
    resourceName.endsWith('Collection'),
    relationAll([resourceName.length > 2, relationEqual(resourceName.charAt(0), resourceName.charAt(0).toUpperCase())]),
  ]);
  return solveRewriteCandidate([
    {
      id: 'collection',
      rewrite: () => ({ kind: 'collection', name: identifier, firstArg: collectionArgument }),
      requirements: [requirement('identifier', relationEqual(identifierKind, 'IDENTIFIER')), requirement('scope', relationEqual(scope, '::')), requirement('operation', relationEqual(operation, 'collection'))],
      exclusions: [],
      dependencies: [],
    },
    {
      id: 'make',
      rewrite: () => ({ kind: 'single', name: identifier, firstArg: collectionArgument }),
      requirements: [requirement('identifier', relationEqual(identifierKind, 'IDENTIFIER')), requirement('scope', relationEqual(scope, '::')), requirement('operation', relationEqual(operation, 'make'))],
      exclusions: [],
      dependencies: [],
    },
    {
      id: 'new',
      rewrite: () => ({ kind: newKind, name: newName, firstArg: newArgument }),
      requirements: [requirement('new', relationEqual(identifier, 'new')), requirement('identifier', relationEqual(relationOptionFold(tokenKindAt(tokens, relationAdvanceIndex(index, 1)), () => '', value => value), 'IDENTIFIER')), requirement('resource-name', resourceNameValid)],
      exclusions: [],
      dependencies: [],
    },
  ]);
};

const scanInvocation = (tokens: readonly Token[], index: number, end: number, hasPaginate: boolean): RelationOption<Invocation> =>
  relationGate(index >= end, () => relationNone(), () => relationOptionFold(invocationAt(tokens, index, hasPaginate),
    () => scanInvocation(tokens, relationAdvanceIndex(index, 1), end, hasPaginate), value => relationSome(value)));

export function detectResourceInvocation(tokens: readonly Token[], k: number) {
  const end = relationFold(tokens, tokens.length, (accumulator, token, index) => relationGate(relationAll([index > k, index < accumulator, relationEqual(token.value, ';')]), () => index, () => accumulator), k);
  const hasPaginate = relationFold(tokens, false, (accumulator, token, index) => relationGate(index < end,
    () => relationAny([accumulator, relationEqual(token.value, 'paginate'), relationEqual(token.value, 'simplePaginate')]), () => accumulator), relationAdvanceIndex(k, 1));
  const candidate = relationGate(relationEqual(relationOptionFold(tokenValueAt(tokens, k), () => '', value => value), 'return'), () => scanInvocation(tokens, relationAdvanceIndex(k, 1), end, hasPaginate), () => relationNone());
  return relationOptionFold(candidate, () => relationNone<DetectedResourceInvocation>(), value => {
    const resourceName = SemanticValueFactory.resourceName(value.name);
    return relationSome({ descriptor: ResourceResponseDescriptor.create({ resourceName, shape: value.kind }), resourceName, firstArg: value.firstArg });
  });
}
