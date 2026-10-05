import type { TokenDescriptor } from './PhpAst';
import { parsePhpMethod } from './phpMethodParser';
import { createAstIdentifier, createSourceOffset, createSourceLineNumber } from './phpAstTypes';
import { classifyAstTokens } from './astClassifier';
import type { ModelDeclarationAst, ModelMethodAst, ModelConstantAst } from './modelAstTypes';
import {
  relationGate,
  relationAny,
  relationAll,
  relationEqual,
  relationSelect,
  relationFirstOption,
  relationFold,
  relationIndexOf,
  relationOptionFold,
  relationVariantFold,
  relationProject,
  relationRange,
  relationSlice,
  relationResolve,
  type RelationOption,
} from '../../../semantic/foundation/relationalSequence';

type ModelTokenOption = RelationOption<TokenDescriptor>;

const token = (tokens: readonly TokenDescriptor[], index: number): ModelTokenOption =>
  relationGate(relationAll([index >= 0, index < tokens.length]), () => ({ kind: 'some', value: tokens[index] }), () => ({ kind: 'none' }));

const matching = (tokens: readonly TokenDescriptor[], start: number): number => {
  const state = relationFold(
    relationRange(tokens, Math.max(start, 0), tokens.length),
    { depth: 0, found: -1 },
    (current, item, relativeIndex) => relationGate(
      current.found >= 0,
      () => current,
      () => {
        const depth = relationGate(relationEqual(item.value, '{'), () => current.depth + 1, () =>
          relationGate(relationEqual(item.value, '}'), () => current.depth - 1, () => current.depth));
        const found = relationGate(relationAll([relationEqual(item.value, '}'), relationEqual(depth, 0)]), () => start + relativeIndex, () => -1);
        return { depth, found };
      },
    ),
  );
  return relationGate(state.found >= 0, () => state.found, () => Math.max(tokens.length - 1, start));
};

const offset = (value: TokenDescriptor): ReturnType<typeof createSourceOffset> => createSourceOffset(Number(value.startOffset));
const line = (value: TokenDescriptor): ReturnType<typeof createSourceLineNumber> => createSourceLineNumber(Number(value.line));

const visibilityKind = (value: string): ModelMethodAst['visibility'] => relationGate(
  relationEqual(value, 'public'),
  () => ({ kind: 'public' }),
  () => relationGate(relationEqual(value, 'protected'), () => ({ kind: 'protected' }), () => ({ kind: 'private' })),
);

const visibility = (tokens: readonly TokenDescriptor[], index: number): ModelMethodAst['visibility'] => {
  const start = Math.max(0, index - 6);
  const candidates = relationProject(relationRange(tokens, start, index), (item, relativeIndex) => ({ item, index: start + relativeIndex }));
  const candidate = relationFirstOption(candidates, entry => relationAny([relationEqual(entry.item.value, 'public'), relationEqual(entry.item.value, 'protected'), relationEqual(entry.item.value, 'private')]));
  const barrier = relationFirstOption(candidates, entry => relationAny([relationEqual(entry.item.value, ';'), relationEqual(entry.item.value, '}'), relationEqual(entry.item.value, '{')]));
  return relationOptionFold(
    candidate,
    () => ({ kind: 'public' }),
    entry => relationOptionFold(
      barrier,
      () => visibilityKind(entry.item.value),
      boundary => relationGate(entry.index > boundary.index, () => visibilityKind(entry.item.value), () => ({ kind: 'public' })),
    ),
  );
};

const inheritanceOf = (tokens: readonly TokenDescriptor[], classIndex: number) => {
  const extendsIndex = relationIndexOf(tokens, (item, index) => relationAll([index > classIndex, relationEqual(item.value, 'extends')]));
  const extendsToken = relationOptionFold(token(tokens, extendsIndex + 1), () => ({ kind: 'none' as const }), value => ({ kind: 'some' as const, value }));
  return relationOptionFold(
    extendsToken,
    () => ({ kind: 'eloquent_model' as const }),
    value => relationGate(
      relationEqual(value.value, 'Authenticatable'),
      () => ({ kind: 'authenticatable' as const }),
      () => ({ kind: 'class' as const, name: createAstIdentifier(value.value) }),
    ),
  );
};

const returnExpressions = (tokens: readonly TokenDescriptor[], start: number, end: number) => {
  const scan = (cursor: number, depth: number, expressionStart: number, expressionDepth: number, values: readonly ReturnType<typeof classifyAstTokens>[]): readonly ReturnType<typeof classifyAstTokens>[] =>
    relationResolve(
      cursor >= end,
      () => values,
      () => {
        const value = tokens[cursor].value;
        const nextDepth = relationGate(relationAny([relationEqual(value, '('), relationEqual(value, '['), relationEqual(value, '{')]), () => depth + 1, () =>
          relationGate(relationAny([relationEqual(value, ')'), relationEqual(value, ']'), relationEqual(value, '}')]), () => depth - 1, () => depth));
        const nextExpressionDepth = relationGate(relationAny([relationEqual(value, '('), relationEqual(value, '['), relationEqual(value, '{')]), () => expressionDepth + 1, () =>
          relationGate(relationAny([relationEqual(value, ')'), relationEqual(value, ']'), relationEqual(value, '}')]), () => expressionDepth - 1, () => expressionDepth));
        const isReturn = relationAll([relationEqual(value, 'return'), relationEqual(depth, 0)]);
        const isEnd = relationAll([relationEqual(value, ';'), relationEqual(expressionDepth, 0)]);
        const nextValues = relationGate(
          isReturn,
          () => scan(cursor + 1, nextDepth, cursor + 1, 0, values),
          () => relationGate(relationAll([isEnd, expressionStart < cursor]), () => scan(cursor + 1, nextDepth, expressionStart, nextExpressionDepth, [...values, classifyAstTokens(relationRange(tokens, expressionStart, cursor))]), () => scan(cursor + 1, nextDepth, expressionStart, nextExpressionDepth, values)),
        );
        return nextValues;
      },
    );
  return scan(start, 0, start, 0, []);
};

type ModelMethodCandidate = { readonly kind: 'none' } | { readonly kind: 'some'; readonly value: ModelMethodAst; readonly skip: number };
type ModelConstantCandidate = { readonly kind: 'none' } | { readonly kind: 'some'; readonly value: ModelConstantAst; readonly skip: number };
type ModelMembers = { readonly traits: readonly ReturnType<typeof createAstIdentifier>[]; readonly methods: readonly ModelMethodAst[]; readonly constants: readonly ModelConstantAst[] };

const scanClassMembers = (tokens: readonly TokenDescriptor[], start: number, close: number): ModelMembers => {
  const visit = (index: number, traits: readonly ReturnType<typeof createAstIdentifier>[], methods: readonly ModelMethodAst[], constants: readonly ModelConstantAst[]): ModelMembers =>
    relationResolve(
      index >= close,
      () => ({ traits, methods, constants }),
      () => {
        const item = tokens[index];
        const useEnd = relationGate(relationEqual(item.value, 'use'), () => relationIndexOf(tokens, (value, cursor) => relationAll([cursor > index, cursor < close, relationEqual(value.value, ';')])), () => -1);
        const traitValues = relationGate(useEnd >= 0, () => relationProject(relationSelect(relationRange(tokens, index + 1, useEnd), value => relationEqual(value.type, 'IDENTIFIER')), value => createAstIdentifier(value.value)), () => []);
        const nextTraits = [...traits, ...traitValues];
        const methodName = token(tokens, index + 1);
        const bodyStart = relationIndexOf(tokens, (value, cursor) => relationAll([cursor > index, relationEqual(value.value, '{')]));
        const bodyEnd = relationGate(bodyStart >= 0, () => matching(tokens, bodyStart), () => index);
        const method: ModelMethodCandidate = relationOptionFold(
          methodName,
          () => ({ kind: 'none' as const }),
          name => relationGate(
            relationEqual(item.value, 'function'),
            () => relationOptionFold(
              parsePhpMethod('', tokens, index),
              () => ({ kind: 'none' as const }),
              parsed => {
                const endToken = relationOptionFold(token(tokens, bodyEnd), () => item, value => value);
                const bodyToken = relationOptionFold(token(tokens, bodyStart), () => item, value => value);
                return {
                kind: 'some',
                value: {
                  kind: 'model_method',
                  name: createAstIdentifier(name.value),
                  documentation: { kind: 'absent' },
                  visibility: visibility(tokens, index),
                  returnType: relationGate(
                    relationEqual(parsed.declaredReturnType.kind, 'absent'),
                    () => ({ kind: 'absent' as const }),
                    () => ({ kind: 'present' as const, value: classifyAstTokens(relationSlice(tokens, index + 1, bodyStart)) }),
                  ),
                  parameters: parsed.parameters,
                  body: { kind: 'block', statements: Object.freeze(parsed.body) },
                  returns: returnExpressions(tokens, bodyStart + 1, bodyEnd),
                  bodyStart: offset(bodyToken),
                  bodyEnd: offset(endToken),
                  startOffset: offset(item),
                  endOffset: offset(endToken),
                  startLine: line(item),
                  endLine: line(endToken),
                },
                skip: Math.max(bodyEnd, index),
              };
              },
            ),
            () => ({ kind: 'none' as const }),
          ),
        );
        const constName = token(tokens, index + 1);
        const equals = relationIndexOf(tokens, (value, cursor) => relationAll([cursor > index, cursor < close, relationEqual(value.value, '=')]));
        const semi = relationIndexOf(tokens, (value, cursor) => relationAll([cursor > index, cursor < close, relationEqual(value.value, ';')]));
        const constant: ModelConstantCandidate = relationOptionFold(
          constName,
          () => ({ kind: 'none' as const }),
          name => relationGate(relationAll([relationEqual(item.value, 'const'), equals >= 0, semi >= 0]), () => ({
            kind: 'some' as const,
            value: {
              kind: 'model_constant',
              documentation: { kind: 'absent' },
              visibility: visibility(tokens, index),
              name: createAstIdentifier(name.value),
              value: classifyAstTokens(relationRange(tokens, equals + 1, semi)),
              startOffset: offset(item),
              endOffset: offset(tokens[semi]),
              startLine: line(item),
              endLine: line(tokens[semi]),
            },
            skip: semi,
          }), () => ({ kind: 'none' as const })),
        );
        const nextMethods = relationVariantFold(method, 'some', () => methods, value => [...methods, value.value]);
        const nextConstants = relationVariantFold(constant, 'some', () => constants, value => [...constants, value.value]);
        const skip = relationVariantFold(method, 'some', () => index, value => value.skip);
        const constantSkip = relationVariantFold(constant, 'some', () => skip, value => Math.max(skip, value.skip));
        return visit(constantSkip + 1, nextTraits, nextMethods, nextConstants);
      },
    );
  return visit(start, [], [], []);
};

export function parseModelDeclaration(tokens: readonly TokenDescriptor[]): ModelDeclarationAst {
  const classIndex = relationIndexOf(tokens, item => relationEqual(item.value, 'class'));
  const classToken = token(tokens, classIndex);
  const nameToken = token(tokens, classIndex + 1);
  const open = relationIndexOf(tokens, (item, index) => relationAll([index > classIndex, relationEqual(item.value, '{')]));
  const close = relationGate(open >= 0, () => matching(tokens, open), () => Math.max(tokens.length - 1, 0));
  return relationOptionFold(
    classToken,
    () => { throw Error('Model class declaration not found'); },
    classValue => relationOptionFold(
      nameToken,
      () => { throw Error('Model class name not found'); },
      nameValue => {
        const members = scanClassMembers(tokens, Math.max(open + 1, 0), close);
        return {
          kind: 'model_declaration' as const,
          name: createAstIdentifier(nameValue.value),
          inheritance: inheritanceOf(tokens, classIndex),
          documentation: { kind: 'absent' as const },
          properties: Object.freeze([]),
          traits: members.traits,
          methods: members.methods,
          constants: members.constants,
          startOffset: offset(classValue),
          endOffset: offset(relationOptionFold(token(tokens, close), () => nameValue, value => value)),
        };
      },
    ),
  );
}