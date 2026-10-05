import { createAstIdentifier, type AstIdentifier, type TokenDescriptor } from './phpAstTypes';
import type { ControllerDeclarationAst } from './controllerAstTypes';
import { relationGate, relationIndexOf, relationProject, relationExpand, relationOptionFold, relationEqual, relationAll, relationSlice, relationSelect } from '../../../semantic/foundation/relationalSequence';
import { relationAny } from '../../../semantic/foundation/semanticRelations';
import { tokenAt } from './tokenEvidence';
import { parseControllerMethod, parseParameterAttributes } from './controllerMethodParser';


const parseDeclaredInterfaces = (tokens: readonly TokenDescriptor[], classIndex: number): readonly AstIdentifier[] => {
  const relativeBodyIndex = relationIndexOf(relationSlice(tokens, Math.max(0, classIndex + 1), tokens.length), token => relationEqual(token.value, '{'));
  const bodyIndex = relativeBodyIndex < 0 ? tokens.length : classIndex + 1 + relativeBodyIndex;
  const classHeader = relationSlice(tokens, Math.max(0, classIndex + 1), bodyIndex);
  const implementsIndex = relationIndexOf(classHeader, token => relationEqual(token.value, 'implements'));
  return relationGate(implementsIndex < 0, () => Object.freeze([]), () => {
    const tail = relationSlice(classHeader, implementsIndex + 1, classHeader.length);
    const candidates = relationSelect(tail, token => relationAll([
      relationEqual(token.type, 'IDENTIFIER'),
      relationEqual(token.value, 'HasMiddleware'),
    ]));
    return Object.freeze(relationProject(candidates, token => createAstIdentifier(token.value)));
  });
};

export function parseControllerDeclaration(
  source: string,
  tokens: readonly TokenDescriptor[],
  className: AstIdentifier,
  filePath = '<php-source>'
): ControllerDeclarationAst {
  const classIndex = relationIndexOf(tokens, token => relationEqual(token.value, 'class'));
  const attributeStart = relationGate(classIndex >= 0, () => relationIndexOf(relationSlice(tokens, 0, classIndex), token => relationEqual(token.value, '#')), () => -1);
  const interfaces = parseDeclaredInterfaces(tokens, classIndex);
  const relativeBodyIndex = relationIndexOf(relationSlice(tokens, Math.max(0, classIndex + 1), tokens.length), token => relationEqual(token.value, '{'));
  const bodyIndex = relativeBodyIndex < 0 ? tokens.length : classIndex + 1 + relativeBodyIndex;
  const classHeader = relationSlice(tokens, Math.max(0, classIndex + 1), bodyIndex);
  const inheritanceIndex = relationIndexOf(classHeader, token => relationEqual(token.value, 'extends'));
  const inheritance = relationGate(inheritanceIndex < 0,
    () => ({ kind: 'none' as const }),
    () => relationOptionFold(tokenAt(classHeader, inheritanceIndex + 1),
      () => ({ kind: 'none' as const }),
      parent => ({ kind: 'class' as const, name: createAstIdentifier(parent.token.value), source: parent.token })));
  const attributes = relationGate(attributeStart >= 0, () => parseParameterAttributes(tokens, Math.max(0, attributeStart)).attributes, () => Object.freeze([]));
  const functionIndexes = collectFunctionIndexes(tokens, 0, []);
  const methods = relationExpand(functionIndexes, index => relationOptionFold(parseControllerMethod(source, tokens, index, filePath), () => [], value => [value]));
  return relationOptionFold(tokenAt(tokens, 0), () => { throw Error('Controller declaration requires source token evidence'); }, evidence => Object.freeze({ attributes, className, inheritance, interfaces, methods: Object.freeze(methods), source: evidence.token }));
}

function collectFunctionIndexes(tokens: readonly TokenDescriptor[], index: number, output: readonly number[]): readonly number[] {
  return relationGate(index >= tokens.length, () => output, () => {
    const valid = relationOptionFold(tokenAt(tokens, index), () => false, first => relationOptionFold(tokenAt(tokens, index + 1), () => false, second => relationAll([relationEqual(first.token.value, 'function'), relationEqual(second.token.type, 'IDENTIFIER')])));
    return collectFunctionIndexes(tokens, index + 1, relationGate(valid, () => [...output, index], () => output));
  });
}
