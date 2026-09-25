import type { TokenDescriptor } from './PhpAst';
import { createAstIdentifier, createSourceOffset, createSourceLineNumber } from './phpAstTypes';
import { classifyAstTokens } from './astClassifier';
import type { ModelDeclarationAst, ModelMethodAst, ModelConstantAst } from './modelAstTypes';

const token = (tokens: readonly TokenDescriptor[], index: number): TokenDescriptor | undefined => tokens[index];
const matching = (tokens: readonly TokenDescriptor[], start: number): number => {
  let depth = 0;
  for (let index = start; index < tokens.length; index += 1) {
    if (tokens[index].value === '{') depth += 1;
    if (tokens[index].value === '}') {
      depth -= 1;
      if (depth === 0) return index;
    }
  }
  return tokens.length - 1;
};
const offset = (value: TokenDescriptor): ReturnType<typeof createSourceOffset> => createSourceOffset(Number(value.startOffset));
const line = (value: TokenDescriptor): ReturnType<typeof createSourceLineNumber> => createSourceLineNumber(Number(value.startLine));
const visibility = (tokens: readonly TokenDescriptor[], index: number): ModelMethodAst['visibility'] => {
  for (let cursor = index - 1; cursor >= Math.max(0, index - 6); cursor -= 1) {
    const value = tokens[cursor].value;
    if (value === 'public') return { kind: 'public' };
    if (value === 'protected') return { kind: 'protected' };
    if (value === 'private') return { kind: 'private' };
    if (value === ';' || value === '}' || value === '{') break;
  }
  return { kind: 'public' };
};

export function parseModelDeclaration(tokens: readonly TokenDescriptor[]): ModelDeclarationAst {
  const classIndex = tokens.findIndex(item => item.value === 'class');
  const classToken = token(tokens, classIndex);
  if (!classToken) throw new Error('Model class declaration not found');
  const nameToken = token(tokens, classIndex + 1);
  if (!nameToken) throw new Error('Model class name not found');
  const extendsIndex = tokens.findIndex((item, index) => index > classIndex && item.value === 'extends');
  const extendsToken = extendsIndex >= 0 ? token(tokens, extendsIndex + 1) : undefined;
  const inheritance = !extendsToken
    ? { kind: 'eloquent_model' as const }
    : extendsToken.value === 'Authenticatable'
      ? { kind: 'authenticatable' as const }
      : { kind: 'class' as const, name: createAstIdentifier(extendsToken.value) };
  const open = tokens.findIndex((item, index) => index > classIndex && item.value === '{');
  const close = open >= 0 ? matching(tokens, open) : tokens.length - 1;
  const traits: ReturnType<typeof createAstIdentifier>[] = [];
  const methods: ModelMethodAst[] = [];
  const constants: ModelConstantAst[] = [];
  for (let index = Math.max(open + 1, 0); index < close; index += 1) {
    const item = tokens[index];
    if (item.value === 'use') {
      for (let cursor = index + 1; cursor < close && tokens[cursor].value !== ';'; cursor += 1) {
        if (tokens[cursor].type === 'IDENTIFIER') traits.push(createAstIdentifier(tokens[cursor].value));
      }
    }
    if (item.value === 'function') {
      const methodName = token(tokens, index + 1);
      const bodyStart = tokens.findIndex((value, cursor) => cursor > index && value.value === '{');
      const bodyEnd = bodyStart >= 0 ? matching(tokens, bodyStart) : index;
      if (methodName) {
        const colon = tokens.findIndex((value, cursor) => cursor > index + 1 && cursor < bodyStart && value.value === ':');
        const returnTokens = colon >= 0 ? tokens.slice(colon + 1, bodyStart) : [];
        const returnType = returnTokens.length > 0 ? { kind: 'present' as const, value: classifyAstTokens(returnTokens) } : { kind: 'absent' as const };
        const returns = [];
        if (bodyStart >= 0) {
          let depth = 1;
          for (let cursor = bodyStart + 1; cursor < bodyEnd; cursor += 1) {
            if (tokens[cursor].value === '{') depth += 1;
            if (tokens[cursor].value === '}') depth -= 1;
            if (tokens[cursor].value !== 'return') continue;
            const expressionStart = cursor + 1;
            let expressionEnd = expressionStart;
            let expressionDepth = 0;
            for (; expressionEnd < bodyEnd; expressionEnd += 1) {
              const value = tokens[expressionEnd].value;
              if (value === '(' || value === '[' || value === '{') expressionDepth += 1;
              if (value === ')' || value === ']' || value === '}') expressionDepth -= 1;
              if (value === ';' && expressionDepth === 0) break;
            }
            if (expressionEnd > expressionStart) returns.push(classifyAstTokens(tokens.slice(expressionStart, expressionEnd)));
          }
        }
        const endToken = token(tokens, bodyEnd) ?? item;
        methods.push({ kind: 'model_method', name: createAstIdentifier(methodName.value), visibility: visibility(tokens, index), returnType, returns, bodyStart: offset(token(tokens, bodyStart) ?? item), bodyEnd: offset(endToken), startOffset: offset(item), endOffset: offset(endToken), startLine: line(item), endLine: line(endToken) });
        index = bodyEnd;
      }
    }
    if (item.value === 'const') {
      const nameToken = token(tokens, index + 1);
      const equals = tokens.findIndex((value, cursor) => cursor > index && cursor < close && value.value === '=');
      const semi = tokens.findIndex((value, cursor) => cursor > index && cursor < close && value.value === ';');
      if (nameToken && equals >= 0 && semi >= 0) {
        const value = classifyAstTokens(tokens.slice(equals + 1, semi));
        const endToken = token(tokens, semi) ?? nameToken;
        constants.push({ kind: 'model_constant', visibility: visibility(tokens, index), name: createAstIdentifier(nameToken.value), value, startOffset: offset(item), endOffset: offset(endToken), startLine: line(item), endLine: line(endToken) });
        index = semi;
      }
    }
  }
  const endToken = token(tokens, close) ?? nameToken;
  return { kind: 'model_declaration', name: createAstIdentifier(nameToken.value), inheritance, traits, methods, constants, startOffset: offset(classToken), endOffset: offset(endToken) };
}
