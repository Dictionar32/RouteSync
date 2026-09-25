import type { PhpAstValue, TokenDescriptor } from './phpAstTypes';
import { classifyAstTokens } from './astClassifier';
import type { ReturnStatementAst } from './controllerAstTypes';

export function parseControllerReturns(source: string, tokens: readonly TokenDescriptor[]): readonly ReturnStatementAst[] {
  const result: ReturnStatementAst[] = [];
  for (let i = 0; i < tokens.length; i++) {
    if (tokens[i].value !== 'return') continue;
    const expressionTokens = collectExpression(tokens, i + 1);
    result.push({ expression: classifyReturnExpression(source, expressionTokens), source: tokens[i] });
  }
  return result;
}

function collectExpression(tokens: readonly TokenDescriptor[], start: number): readonly TokenDescriptor[] {
  const result: TokenDescriptor[] = [];
  let depth = 0;
  for (let i = start; i < tokens.length; i++) {
    const token = tokens[i];
    if (token.value === '(' || token.value === '[' || token.value === '{') depth++;
    if (token.value === ')' || token.value === ']' || token.value === '}') depth--;
    if (token.value === ';' && depth === 0) break;
    result.push(token);
  }
  return result;
}

function classifyReturnExpression(_source: string, tokens: readonly TokenDescriptor[]): PhpAstValue {
  return classifyAstTokens(tokens);
}
