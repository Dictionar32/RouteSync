import type { PhpAstValue, TokenDescriptor } from './phpAstTypes';
import { classifyAstTokens } from './astClassifier';
import type { ReturnStatementAst } from './controllerAstTypes';
import { relationAll, relationAny, relationEqual } from '../../../semantic/kernel/semanticRelations';
import { relationGate, relationProject, relationSelect } from '../../../semantic/kernel/relationalSequence';

const returnToken = (token: TokenDescriptor): boolean => relationEqual(token.value, 'return');

const collectExpression = (
  tokens: readonly TokenDescriptor[],
  start: number,
  cursor = start,
  depth = 0,
  output: readonly TokenDescriptor[] = [],
): readonly TokenDescriptor[] => {
  const token = tokens[cursor];
  return relationGate(
    relationEqual(cursor, tokens.length),
    () => output,
    () => {
      const opens = relationAny([relationEqual(token?.value, '('), relationEqual(token?.value, '['), relationEqual(token?.value, '{')]);
      const closes = relationAny([relationEqual(token?.value, ')'), relationEqual(token?.value, ']'), relationEqual(token?.value, '}')]);
      const nextDepth = depth + Number(opens) - Number(closes);
      const terminal = relationAll([relationEqual(token?.value, ';'), relationEqual(depth, 0)]);
      return relationGate(
        terminal,
        () => output,
        () => collectExpression(tokens, start, cursor + 1, nextDepth, [...output, token]),
      );
    },
  );
};

const classifyReturnExpression = (_source: string, tokens: readonly TokenDescriptor[]): PhpAstValue => classifyAstTokens(tokens);

const returnExpressions = (source: string, tokens: readonly TokenDescriptor[], index = 0): readonly ReturnStatementAst[] =>
  relationGate(
    relationEqual(index, tokens.length),
    () => [],
    () => {
      const token = tokens[index];
      const statements = relationSelect([token], returnToken);
      const current = relationProject(statements, () => ({
        expression: classifyReturnExpression(source, collectExpression(tokens, index + 1)),
        source: token,
      }));
      const tail = returnExpressions(source, tokens, index + 1);
      return relationGate(returnToken(token), () => [...current, ...tail], () => tail);
    },
  );

export function parseControllerReturns(source: string, tokens: readonly TokenDescriptor[]): readonly ReturnStatementAst[] {
  return returnExpressions(source, tokens);
}
