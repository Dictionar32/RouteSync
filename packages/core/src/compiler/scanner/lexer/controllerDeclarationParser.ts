import type { AstIdentifier, TokenDescriptor } from './phpAstTypes';
import type { ControllerDeclarationAst } from './controllerAstTypes';
import { relationGate, relationIndexOf, relationProject, relationExpand, relationOptionFold, relationEqual, relationAll, relationSlice } from '../../../semantic/kernel/relationalSequence';
import { parseControllerMethod, parseParameterAttributes } from './controllerMethodParser';

export function parseControllerDeclaration(
  source: string,
  tokens: readonly TokenDescriptor[],
  className: AstIdentifier,
  filePath = '<php-source>'
): ControllerDeclarationAst {
  const classIndex = relationIndexOf(tokens, token => relationEqual(token.value, 'class'));
  const attributeStart = relationGate(classIndex >= 0, () => relationIndexOf(relationSlice(tokens, 0, classIndex), token => relationEqual(token.value, '#')), () => -1);
  const attributes = relationGate(attributeStart >= 0, () => parseParameterAttributes(tokens, Math.max(0, attributeStart)).attributes, () => Object.freeze([]));
  const functionIndexes = collectFunctionIndexes(tokens, 0, []);
  const methods = relationExpand(functionIndexes, index => relationOptionFold(parseControllerMethod(source, tokens, index, filePath), () => [], value => [value]));
  return Object.freeze({ attributes, className, methods: Object.freeze(methods), source: tokens[0] });
}

function collectFunctionIndexes(tokens: readonly TokenDescriptor[], index: number, output: readonly number[]): readonly number[] {
  return relationGate(index >= tokens.length, () => output, () => {
    const valid = relationAll([relationEqual(tokens[index]?.value, 'function'), relationEqual(tokens[index + 1]?.type, 'IDENTIFIER')]);
    return collectFunctionIndexes(tokens, index + 1, relationGate(valid, () => [...output, index], () => output));
  });
}
