/**
 * resourceInvocationDetector.ts
 *
 * Detects JsonResource invocations (collection, make, new) from AST tokens.
 *
 * @module core/compiler/scanner/subscanners/controller/resourceInvocationDetector
 */

import type { Token } from '../lexer/types';
import type { PhpAstValue } from '../lexer/PhpAst';
import { classifyAstTokens } from '../lexer/astClassifier';
import { ResourceResponseDescriptor } from '../../../../types/route';
import type { ResourceName } from '../../../../types/upstream/names';
import { SemanticValueFactory } from '../../../../types/domain/semanticValues';

export interface DetectedResourceInvocation {
  readonly descriptor: ResourceResponseDescriptor;
  readonly resourceName: ResourceName;
  readonly firstArg?: PhpAstValue;
}

export function extractFirstArgument(tokens: readonly Token[], openParenIdx: number): PhpAstValue | undefined {
  let idx = openParenIdx + 1;
  while (idx < tokens.length && (tokens[idx].value === ' ' || tokens[idx].value === '\n' || tokens[idx].value === '\t')) idx++;
  if (idx >= tokens.length || tokens[idx].value === ')') return undefined;

  const argument: Token[] = [];
  let depth = 0;
  for (; idx < tokens.length; idx++) {
    const token = tokens[idx];
    if (token.value === '(' || token.value === '[' || token.value === '{') depth++;
    if (token.value === ')' && depth === 0) break;
    if (token.value === ',' && depth === 0) break;
    if (token.value === ')' || token.value === ']' || token.value === '}') depth--;
    argument.push(token);
  }
  return argument.length === 0 ? undefined : classifyAstTokens(argument);
}

export function detectResourceInvocation(
  tokens: readonly Token[],
  k: number
): DetectedResourceInvocation | undefined {
  if (tokens[k].value !== 'return') return undefined;

  let endIdx = k + 1;
  let hasPaginate = false;
  while (endIdx < tokens.length && tokens[endIdx].value !== ';') {
    if (tokens[endIdx].value === 'paginate' || tokens[endIdx].value === 'simplePaginate') {
      hasPaginate = true;
    }
    endIdx++;
  }

  for (let i = k + 1; i < endIdx; i++) {
    if (tokens[i]?.type === 'IDENTIFIER' && tokens[i + 1]?.value === '::' && tokens[i + 2]?.value === 'collection') {
      const resName = tokens[i].value;
      const firstArg = tokens[i + 3]?.value === '(' ? extractFirstArgument(tokens, i + 3) : undefined;
      const resourceName = SemanticValueFactory.resourceName(resName);
      return {
        descriptor: new ResourceResponseDescriptor({ resourceName, shape: 'collection' }),
        resourceName,
        firstArg
      };
    }

    if (tokens[i]?.type === 'IDENTIFIER' && tokens[i + 1]?.value === '::' && tokens[i + 2]?.value === 'make') {
      const resName = tokens[i].value;
      const firstArg = tokens[i + 3]?.value === '(' ? extractFirstArgument(tokens, i + 3) : undefined;
      const resourceName = SemanticValueFactory.resourceName(resName);
      return {
        descriptor: new ResourceResponseDescriptor({ resourceName, shape: 'single' }),
        resourceName,
        firstArg
      };
    }

    if (tokens[i]?.value === 'new' && tokens[i + 1]?.type === 'IDENTIFIER') {
      const resName = tokens[i + 1].value;
      if (resName.endsWith('Resource') || resName.endsWith('Collection') || (resName.charAt(0) === resName.charAt(0).toUpperCase() && resName.length > 2)) {
        const firstArg = tokens[i + 2]?.value === '(' ? extractFirstArgument(tokens, i + 2) : undefined;
        const shape = (resName.endsWith('Collection') || hasPaginate) ? 'collection' : 'single';
        const resourceName = SemanticValueFactory.resourceName(resName);
        return {
          descriptor: new ResourceResponseDescriptor({ resourceName, shape }),
          resourceName,
          firstArg
        };
      }
    }
  }

  return undefined;
}
