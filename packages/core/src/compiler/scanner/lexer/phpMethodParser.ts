import type { TokenDescriptor } from './phpAstTypes';
import { createAstIdentifier } from './phpAstTypes';
import { classifyAstTokens, classifyPhpBlock } from './astClassifier';
import type { PhpMethodAst, PhpParameterAst } from './phpMethodAstTypes';
import type { PhpParameterTypeAst } from './phpMethodAstTypes';

export function parsePhpMethod(source: string, tokens: readonly TokenDescriptor[], functionIndex: number): PhpMethodAst | undefined {
  const nameToken = tokens[functionIndex + 1];
  if (!nameToken) return undefined;
  const bodyStart = findBodyStart(tokens, functionIndex + 2);
  if (bodyStart < 0) return undefined;
  const bodyEnd = findMatching(tokens, bodyStart, '{', '}');
  if (bodyEnd < 0) return undefined;
  const bodyTokens = tokens.slice(bodyStart + 1, bodyEnd);
  const parameters = parseParameters(tokens, functionIndex + 2);
  const parameterClose = findParameterClose(tokens, functionIndex + 2);
  return Object.freeze({
    name: createAstIdentifier(nameToken.value),
    parameters: Object.freeze(parameters),
    declaredReturnType: parseDeclaredReturnType(tokens, parameterClose + 1, bodyStart),
    body: Object.freeze(classifyPhpBlock(bodyTokens).statements),
    source: tokens[functionIndex],
  });
}

function parseParameters(tokens: readonly TokenDescriptor[], start: number): PhpParameterAst[] {
  const result: PhpParameterAst[] = [];
  for (let i = start; i < tokens.length && tokens[i].value !== '{'; i++) {
    const typeToken = tokens[i];
    const nextToken = tokens[i + 1];
    if (!typeToken || !nextToken) continue;
    if (typeToken.value === '?') {
      const innerToken = nextToken;
      const variableToken = tokens[i + 2];
      if (innerToken.type !== 'IDENTIFIER' || variableToken?.type !== 'VARIABLE') continue;
      const name = createAstIdentifier(variableToken.value.slice(1));
      const parsed = parseParameterDefault(tokens, i + 3);
      result.push({ type: { kind: 'nullable', inner: parseParameterType(innerToken.value) }, defaultValue: parsed.value, name, source: { ...innerToken, endOffset: parsed.endIndex >= 0 ? tokens[parsed.endIndex].endOffset : variableToken.endOffset } });
      i = parsed.endIndex >= 0 ? parsed.endIndex : i + 2;
      continue;
    }
    if (nextToken.type !== 'VARIABLE' || typeToken.type !== 'IDENTIFIER') continue;
    const name = createAstIdentifier(nextToken.value.slice(1));
    const parsed = parseParameterDefault(tokens, i + 2);
    result.push({ type: parseParameterType(typeToken.value), defaultValue: parsed.value, name, source: { ...typeToken, endOffset: parsed.endIndex >= 0 ? tokens[parsed.endIndex].endOffset : nextToken.endOffset } });
    i = parsed.endIndex >= 0 ? parsed.endIndex : i + 1;
  }
  return result;
}

function parseParameterType(value: string): PhpParameterTypeAst {
  switch (value) {
    case 'string': case 'int': case 'float': case 'bool': case 'mixed': case 'array': return { kind: 'primitive', name: value };
    default: return { kind: 'named', name: createAstIdentifier(value) };
  }
}

function parseParameterDefault(tokens: readonly TokenDescriptor[], start: number): { readonly value: PhpParameterAst['defaultValue']; readonly endIndex: number } {
  if (tokens[start]?.value !== '=') return { value: { kind: 'absent' }, endIndex: -1 };
  const expression: TokenDescriptor[] = [];
  let depth = 0;
  for (let i = start + 1; i < tokens.length; i++) {
    const token = tokens[i];
    if (token.value === '(' || token.value === '[' || token.value === '{') depth++;
    if (token.value === ')' || token.value === ']' || token.value === '}') {
      if (depth === 0) break;
      depth--;
    }
    if ((token.value === ',' || token.value === ')') && depth === 0) break;
    expression.push(token);
  }
  return expression.length === 0
    ? { value: { kind: 'present', value: { kind: 'unsupported', reason: 'unclassified_expression', tokens: [] } }, endIndex: start }
    : { value: { kind: 'present', value: classifyAstTokens(expression) }, endIndex: start + expression.length };
}

function parseDeclaredReturnType(tokens: readonly TokenDescriptor[], start: number, bodyStart: number): PhpMethodAst['declaredReturnType'] {
  for (let i = start; i < bodyStart; i++) {
    if (tokens[i].value !== ':') continue;
    const typeToken = tokens[i + 1];
    if (!typeToken) return { kind: 'absent' };
    if (typeToken.value === '?') {
      const inner = tokens[i + 2];
      if (!inner) return { kind: 'absent' };
      return { kind: 'declared', type: { kind: 'nullable', inner: parseParameterType(inner.value) } };
    }
    return { kind: 'declared', type: parseParameterType(typeToken.value) };
  }
  return { kind: 'absent' };
}

function findParameterClose(tokens: readonly TokenDescriptor[], start: number): number {
  let depth = 0;
  for (let i = start; i < tokens.length; i++) {
    if (tokens[i].value === '(') depth++;
    if (tokens[i].value === ')') { depth--; if (depth === 0) return i; }
  }
  return -1;
}
function findBodyStart(tokens: readonly TokenDescriptor[], start: number): number { for (let i = start; i < tokens.length; i++) { if (tokens[i].value === '{') return i; if (tokens[i].value === ';') return -1; } return -1; }
function findMatching(tokens: readonly TokenDescriptor[], start: number, open: string, close: string): number { let depth = 0; for (let i = start; i < tokens.length; i++) { if (tokens[i].value === open) depth++; if (tokens[i].value === close) depth--; if (depth === 0) return i; } return -1; }
