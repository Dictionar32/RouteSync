import type { TokenDescriptor } from './phpAstTypes';
import { createAstIdentifier } from './phpAstTypes';
import { classifyAstTokens, classifyPhpBlock } from './astClassifier';
import type { PhpMethodAst, PhpParameterAst, PhpParameterTypeAst } from './phpMethodAstTypes';
import { relationAll, relationAny, relationEqual, relationGate, relationNone, relationSome, type RelationOption } from '../../../semantic/kernel/semanticRelations';
import { relationOptionFold, relationSlice, relationTextSlice } from '../../../semantic/kernel/relationalSequence';

export function parsePhpMethod(source: string, tokens: readonly TokenDescriptor[], functionIndex: number): RelationOption<PhpMethodAst> {
  const name = relationSome(tokens[functionIndex + 1]);
  return relationOptionFold(name, () => relationNone(), nameToken =>
    relationOptionFold(findBodyStart(tokens, functionIndex + 2), () => relationNone(), bodyStart =>
      relationOptionFold(findMatching(tokens, bodyStart, '{', '}'), () => relationNone(), bodyEnd => {
        const parameters = parseParameters(tokens, functionIndex + 2, []);
        const parameterClose = findParameterClose(tokens, functionIndex + 2);
        const declaredReturnType = relationOptionFold(parameterClose, () => ({ kind: 'absent' }), close => parseDeclaredReturnType(tokens, close + 1, bodyStart));
        const bodyTokens = relationSlice(tokens, bodyStart + 1, bodyEnd);
        return relationSome(Object.freeze({
          name: createAstIdentifier(nameToken.value),
          parameters: Object.freeze(parameters),
          declaredReturnType,
          body: Object.freeze(classifyPhpBlock(bodyTokens).statements),
          source: tokens[functionIndex],
        }));
      }),
    ),
  );
}

export function parsePhpMethodOrThrow(source: string, tokens: readonly TokenDescriptor[], functionIndex: number): PhpMethodAst {
  return relationOptionFold(parsePhpMethod(source, tokens, functionIndex), () => { throw Error('PHP method relation did not resolve'); }, value => value);
}

function parseParameters(tokens: readonly TokenDescriptor[], index: number, result: readonly PhpParameterAst[]): readonly PhpParameterAst[] {
  const token = tokens[index];
  return relationGate(relationAll([Boolean(token), !relationEqual(token.value, '{')]), () => {
    const next = tokens[index + 1];
    const variable = tokens[index + 2];
    const nullableValid = relationAll([relationEqual(token.value, '?'), Boolean(next), Boolean(variable), relationEqual(next?.type, 'IDENTIFIER'), relationEqual(variable?.type, 'VARIABLE')]);
    const standardValid = relationAll([Boolean(next), Boolean(variable), relationEqual(next?.type, 'VARIABLE'), relationEqual(token.type, 'IDENTIFIER')]);
    const selected = relationGate(nullableValid, () => {
      const parsed = parseParameterDefault(tokens, index + 3);
      const endOffset = relationOptionFold(parsed.endIndex, () => variable.endOffset, end => relationOptionFold(relationGate(Boolean(tokens[end]), () => relationSome(tokens[end].endOffset), () => relationNone<number>()), () => variable.endOffset, value => value));
      return relationSome({ type: { kind: 'nullable', inner: parseParameterType(next.value) }, defaultValue: parsed.value, name: createAstIdentifier(relationTextSlice(variable.value, 1)), source: { ...next, endOffset } });
    }, () => relationGate(standardValid, () => {
      const parsed = parseParameterDefault(tokens, index + 2);
      const endOffset = relationOptionFold(parsed.endIndex, () => next.endOffset, end => relationOptionFold(relationGate(Boolean(tokens[end]), () => relationSome(tokens[end].endOffset), () => relationNone<number>()), () => next.endOffset, value => value));
      return relationSome({ type: parseParameterType(token.value), defaultValue: parsed.value, name: createAstIdentifier(relationTextSlice(next.value, 1)), source: { ...token, endOffset } });
    }, () => relationNone<PhpParameterAst>()));
    const fallbackIndex = index + relationGate(nullableValid, () => 3, () => 2);
    const nextIndex = relationOptionFold(selected, () => fallbackIndex, () => relationOptionFold(parseParameterDefault(tokens, fallbackIndex).endIndex, () => fallbackIndex, end => end + 1));
    return relationOptionFold(selected, () => parseParameters(tokens, nextIndex, result), value => parseParameters(tokens, nextIndex, result.concat([value])));
  }, () => result);
}

function parseParameterType(value: string): PhpParameterTypeAst {
  const primitive = relationGate(['string', 'int', 'float', 'bool', 'mixed', 'array'].includes(value), () => ({ kind: 'primitive', name: value }), () => ({ kind: 'named', name: createAstIdentifier(value) }));
  return primitive;
}

type DefaultParse = { readonly value: PhpParameterAst['defaultValue']; readonly endIndex: RelationOption<number> };

function parseParameterDefault(tokens: readonly TokenDescriptor[], start: number): DefaultParse {
  return relationGate(relationEqual(tokens[start]?.value, '='), () => parseParameterExpression(tokens, start + 1, 0, []), () => ({ value: { kind: 'absent' }, endIndex: relationNone() }));
}

function parseParameterExpression(tokens: readonly TokenDescriptor[], index: number, depth: number, expression: readonly TokenDescriptor[]): DefaultParse {
  const token = tokens[index];
  return relationGate(Boolean(token), () => {
    const opening = ['(', '[', '{'].includes(token.value);
    const closing = [')', ']', '}'].includes(token.value);
    const boundary = relationAll([relationAny([relationEqual(token.value, ','), relationEqual(token.value, ')')]), relationEqual(depth, 0)]);
    return relationGate(boundary, () => expressionResult(expression, index - 1), () =>
      relationGate(relationAll([closing, relationEqual(depth, 0)]), () => expressionResult(expression, index - 1), () => {
        const nextDepth = relationGate(opening, () => depth + 1, () => relationGate(closing, () => depth - 1, () => depth));
        return parseParameterExpression(tokens, index + 1, nextDepth, expression.concat([token]));
      }),
    );
  }, () => expressionResult(expression, index - 1));
}

function expressionResult(expression: readonly TokenDescriptor[], endIndex: number): DefaultParse {
  const value = relationGate(relationEqual(expression.length, 0),
    () => ({ kind: 'present', value: { kind: 'unsupported', reason: 'unclassified_expression', tokens: [] } }),
    () => ({ kind: 'present', value: classifyAstTokens(expression) }));
  return { value, endIndex: relationGate(endIndex >= 0, () => relationSome(endIndex), () => relationNone()) };
}

function parseDeclaredReturnType(tokens: readonly TokenDescriptor[], index: number, bodyStart: number): PhpMethodAst['declaredReturnType'] {
  const token = tokens[index];
  return relationGate(relationAll([index < bodyStart, Boolean(token)]), () =>
    relationGate(relationEqual(token.value, ':'), () => {
      const typeToken = tokens[index + 1];
      return relationGate(Boolean(typeToken), () =>
        relationGate(relationEqual(typeToken.value, '?'), () => {
          const inner = tokens[index + 2];
          return relationGate(Boolean(inner), () => ({ kind: 'declared', type: { kind: 'nullable', inner: parseParameterType(inner.value) } }), () => ({ kind: 'absent' }));
        }, () => ({ kind: 'declared', type: parseParameterType(typeToken.value) })),
      () => ({ kind: 'absent' }));
    }, () => parseDeclaredReturnType(tokens, index + 1, bodyStart)),
  () => ({ kind: 'absent' }));
}

function findParameterClose(tokens: readonly TokenDescriptor[], index: number, depth = 0): RelationOption<number> {
  const token = tokens[index];
  return relationGate(Boolean(token), () => {
    const nextDepth = relationGate(relationEqual(token.value, '('), () => depth + 1, () => relationGate(relationEqual(token.value, ')'), () => depth - 1, () => depth));
    return relationGate(relationAll([relationEqual(token.value, ')'), relationEqual(nextDepth, 0)]), () => relationSome(index), () => findParameterClose(tokens, index + 1, nextDepth));
  }, () => relationNone());
}

function findBodyStart(tokens: readonly TokenDescriptor[], index: number): RelationOption<number> {
  const token = tokens[index];
  return relationGate(Boolean(token), () => relationGate(relationEqual(token.value, '{'), () => relationSome(index), () => relationGate(relationEqual(token.value, ';'), () => relationNone(), () => findBodyStart(tokens, index + 1))), () => relationNone());
}

function findMatching(tokens: readonly TokenDescriptor[], index: number, open: string, close: string, depth = 0): RelationOption<number> {
  const token = tokens[index];
  return relationGate(Boolean(token), () => {
    const nextDepth = relationGate(relationEqual(token.value, open), () => depth + 1, () => relationGate(relationEqual(token.value, close), () => depth - 1, () => depth));
    return relationGate(relationAll([relationEqual(token.value, close), relationEqual(nextDepth, 0)]), () => relationSome(index), () => findMatching(tokens, index + 1, open, close, nextDepth));
  }, () => relationNone());
}
