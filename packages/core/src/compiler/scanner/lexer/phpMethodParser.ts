import type { TokenDescriptor } from './phpAstTypes';
import { createAstIdentifier } from './phpAstTypes';
import { classifyAstTokens, classifyPhpBlock } from './astClassifier';
import type { PhpMethodAst, PhpParameterAst, PhpParameterTypeAst } from './phpMethodAstTypes';
import { relationAll, relationAny, relationEqual, relationGate, relationNone, relationSome, relationIsSome, relationNotEqual, type RelationOption } from '../../../semantic/kernel/semanticRelations';
import { relationOptionFold, relationSlice, relationTextSlice, relationFirstOption } from '../../../semantic/kernel/relationalSequence';
import { tokenAt, tokenValueEquals, tokenKindEquals } from './tokenEvidence';

export function parsePhpMethod(source: string, tokens: readonly TokenDescriptor[], functionIndex: number): RelationOption<PhpMethodAst> {
  return relationOptionFold(tokenAt(tokens, functionIndex + 1), () => relationNone(), nameEvidence =>
    relationOptionFold(findBodyStart(tokens, functionIndex + 2), () => relationNone(), bodyStart =>
      relationOptionFold(findMatching(tokens, bodyStart, '{', '}'), () => relationNone(), bodyEnd =>
        relationOptionFold(tokenAt(tokens, functionIndex), () => relationNone(), sourceEvidence => {
          const parameters = parseParameters(tokens, functionIndex + 2, []);
          const parameterClose = findParameterClose(tokens, functionIndex + 2);
          const declaredReturnType: PhpMethodAst['declaredReturnType'] = relationOptionFold(parameterClose, () => ({ kind: 'absent' as const }), close => parseDeclaredReturnType(tokens, close + 1, bodyStart));
          const bodyTokens = relationSlice(tokens, bodyStart + 1, bodyEnd);
          const method: PhpMethodAst = Object.freeze({
            name: createAstIdentifier(nameEvidence.token.value),
            parameters: Object.freeze(parameters),
            declaredReturnType,
            body: Object.freeze(classifyPhpBlock(bodyTokens).statements),
            source: sourceEvidence.token,
          });
          return relationSome(method);
        }),
      ),
    ),
  );
}

/**
 * Compatibility boundary for legacy scanners. The canonical parser result remains
 * RelationOption<PhpMethodAst>; this adapter collapses the accepted judgment at
 * the legacy consumer boundary until those consumers migrate to the judgment.
 */
export function parsePhpMethodOrThrow(source: string, tokens: readonly TokenDescriptor[], functionIndex: number): PhpMethodAst {
  return relationOptionFold(
    parsePhpMethod(source, tokens, functionIndex),
    () => { throw Error('PHP method parse rejected at semantic AST boundary'); },
    value => value,
  );
}

function parseParameters(tokens: readonly TokenDescriptor[], index: number, result: readonly PhpParameterAst[]): readonly PhpParameterAst[] {
  return relationOptionFold(tokenAt(tokens, index), () => result, token =>
    relationGate(relationNotEqual(token.token.value, '{'), () => {
      const nextOption = tokenAt(tokens, index + 1);
      const variableOption = tokenAt(tokens, index + 2);
      const nullableValid = relationAll([
        relationEqual(token.token.value, '?'),
        relationIsSome(nextOption),
        relationIsSome(variableOption),
        tokenKindEquals(tokens, index + 1, 'IDENTIFIER'),
        tokenKindEquals(tokens, index + 2, 'VARIABLE'),
      ]);
      const standardValid = relationAll([
        relationIsSome(nextOption),
        relationIsSome(variableOption),
        tokenKindEquals(tokens, index + 1, 'VARIABLE'),
        tokenKindEquals(tokens, index, 'IDENTIFIER'),
      ]);
      return relationOptionFold(nextOption, () => result, next => relationOptionFold(variableOption, () => result, variable => {
        const selected: RelationOption<PhpParameterAst> = relationGate(nullableValid, () => {
          const parsed = parseParameterDefault(tokens, index + 3);
          const endOffset = relationOptionFold(parsed.endIndex, () => variable.token.endOffset, end => relationOptionFold(tokenAt(tokens, end), () => variable.token.endOffset, value => value.token.endOffset));
          return relationSome({ type: { kind: 'nullable' as const, inner: parseParameterType(next.token.value) }, defaultValue: parsed.value, name: createAstIdentifier(relationTextSlice(variable.token.value, 1)), source: { ...next.token, endOffset } });
        }, () => relationGate(standardValid, () => {
          const parsed = parseParameterDefault(tokens, index + 2);
          const endOffset = relationOptionFold(parsed.endIndex, () => next.token.endOffset, end => relationOptionFold(tokenAt(tokens, end), () => next.token.endOffset, value => value.token.endOffset));
          return relationSome({ type: parseParameterType(token.token.value), defaultValue: parsed.value, name: createAstIdentifier(relationTextSlice(next.token.value, 1)), source: { ...token.token, endOffset } });
        }, () => relationNone<PhpParameterAst>()));
        const fallbackIndex = index + relationGate(nullableValid, () => 3, () => 2);
        const nextIndex = relationOptionFold(selected, () => fallbackIndex, () => relationOptionFold(parseParameterDefault(tokens, fallbackIndex).endIndex, () => fallbackIndex, end => end + 1));
        return relationOptionFold(selected, () => parseParameters(tokens, nextIndex, result), value => parseParameters(tokens, nextIndex, result.concat([value])));
      }));
    }, () => result),
  );
}

function parseParameterType(value: string): PhpParameterTypeAst {
  const primitiveNames = ['string', 'int', 'float', 'bool', 'mixed', 'array'] as const;
  const primitive = relationFirstOption(primitiveNames, name => relationEqual(name, value));
  return relationOptionFold(
    primitive,
    () => ({ kind: 'named' as const, name: createAstIdentifier(value) }),
    name => ({ kind: 'primitive' as const, name }),
  );
}

type DefaultParse = { readonly value: PhpParameterAst['defaultValue']; readonly endIndex: RelationOption<number> };

function parseParameterDefault(tokens: readonly TokenDescriptor[], start: number): DefaultParse {
  return relationGate(tokenValueEquals(tokens, start, '='), () => parseParameterExpression(tokens, start + 1, 0, []), () => ({ value: { kind: 'absent' }, endIndex: relationNone() }));
}

function parseParameterExpression(tokens: readonly TokenDescriptor[], index: number, depth: number, expression: readonly TokenDescriptor[]): DefaultParse {
  return relationOptionFold(tokenAt(tokens, index), () => expressionResult(expression, index - 1), evidence => {
    const token = evidence.token;
    const opening = ['(', '[', '{'].includes(token.value);
    const closing = [')', ']', '}'].includes(token.value);
    const boundary = relationAll([relationAny([relationEqual(token.value, ','), relationEqual(token.value, ')')]), relationEqual(depth, 0)]);
    return relationGate(boundary, () => expressionResult(expression, index - 1), () =>
      relationGate(relationAll([closing, relationEqual(depth, 0)]), () => expressionResult(expression, index - 1), () => {
        const nextDepth = relationGate(opening, () => depth + 1, () => relationGate(closing, () => depth - 1, () => depth));
        return parseParameterExpression(tokens, index + 1, nextDepth, expression.concat([token]));
      }),
    );
  });
}

function expressionResult(expression: readonly TokenDescriptor[], endIndex: number): DefaultParse {
  const value = relationGate(relationEqual(expression.length, 0),
    () => ({ kind: 'present' as const, value: classifyAstTokens([]) }),
    () => ({ kind: 'present' as const, value: classifyAstTokens(expression) }));
  return { value, endIndex: relationGate(endIndex >= 0, () => relationSome(endIndex), () => relationNone()) };
}

function parseDeclaredReturnType(tokens: readonly TokenDescriptor[], index: number, bodyStart: number): PhpMethodAst['declaredReturnType'] {
  return relationOptionFold(tokenAt(tokens, index), () => ({ kind: 'absent' }), tokenEvidence =>
    relationGate(index < bodyStart, () =>
      relationGate(relationEqual(tokenEvidence.token.value, ':'), () =>
        relationOptionFold(tokenAt(tokens, index + 1), () => ({ kind: 'absent' }), typeEvidence =>
          relationGate(relationEqual(typeEvidence.token.value, '?'), () =>
            relationOptionFold(tokenAt(tokens, index + 2), () => ({ kind: 'absent' }), inner => ({ kind: 'declared', type: { kind: 'nullable', inner: parseParameterType(inner.token.value) } })),
            () => ({ kind: 'declared', type: parseParameterType(typeEvidence.token.value) }),
          ),
        ),
        () => parseDeclaredReturnType(tokens, index + 1, bodyStart),
      ),
      () => ({ kind: 'absent' }),
    ),
  );
}

function findParameterClose(tokens: readonly TokenDescriptor[], index: number, depth = 0): RelationOption<number> {
  return relationOptionFold(tokenAt(tokens, index), () => relationNone(), evidence => {
    const token = evidence.token;
    const nextDepth = relationGate(relationEqual(token.value, '('), () => depth + 1, () => relationGate(relationEqual(token.value, ')'), () => depth - 1, () => depth));
    return relationGate(relationAll([relationEqual(token.value, ')'), relationEqual(nextDepth, 0)]), () => relationSome(index), () => findParameterClose(tokens, index + 1, nextDepth));
  });
}

function findBodyStart(tokens: readonly TokenDescriptor[], index: number): RelationOption<number> {
  return relationOptionFold(tokenAt(tokens, index), () => relationNone(), evidence =>
    relationGate(relationEqual(evidence.token.value, '{'), () => relationSome(index), () =>
      relationGate(relationEqual(evidence.token.value, ';'), () => relationNone(), () => findBodyStart(tokens, index + 1)),
    ),
  );
}

function findMatching(tokens: readonly TokenDescriptor[], index: number, open: string, close: string, depth = 0): RelationOption<number> {
  return relationOptionFold(tokenAt(tokens, index), () => relationNone(), evidence => {
    const token = evidence.token;
    const nextDepth = relationGate(relationEqual(token.value, open), () => depth + 1, () => relationGate(relationEqual(token.value, close), () => depth - 1, () => depth));
    return relationGate(relationAll([relationEqual(token.value, close), relationEqual(nextDepth, 0)]), () => relationSome(index), () => findMatching(tokens, index + 1, open, close, nextDepth));
  });
}

