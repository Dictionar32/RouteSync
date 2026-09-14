/**
 * resourceInvocationDetector.ts
 *
 * Detects JsonResource invocations (collection, make, new) from AST tokens.
 *
 * @module core/compiler/scanner/subscanners/controller/resourceInvocationDetector
 */

import type { Token } from '../lexer/types';
import { ResourceResponseDescriptor } from '../../../../types/route';

export interface DetectedResourceInvocation {
  readonly descriptor: ResourceResponseDescriptor;
  readonly resourceName: string;
  readonly firstArg?: string;
}

export function extractFirstArgument(tokens: readonly Token[], openParenIdx: number): string | undefined {
  let idx = openParenIdx + 1;
  while (idx < tokens.length && (tokens[idx].value === ' ' || tokens[idx].value === '\n' || tokens[idx].value === '\t')) {
    idx++;
  }
  if (idx >= tokens.length || tokens[idx].value === ')') {
    return undefined;
  }
  if (tokens[idx].type === 'VARIABLE') {
    return tokens[idx].value;
  }
  if (tokens[idx].type === 'IDENTIFIER') {
    return tokens[idx].value;
  }
  if (tokens[idx].value === 'DB' && tokens[idx + 1]?.value === '::' && tokens[idx + 2]?.value === 'table') {
    if (tokens[idx + 3]?.value === '(') {
      const tableToken = tokens[idx + 4];
      if (tableToken) {
        const cleanTable = tableToken.value.replace(/['"]/g, '');
        return `table:${cleanTable}`;
      }
    }
  }
  return undefined;
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
      return {
        descriptor: new ResourceResponseDescriptor({ resourceName: resName, shape: 'collection' }),
        resourceName: resName,
        firstArg
      };
    }

    if (tokens[i]?.type === 'IDENTIFIER' && tokens[i + 1]?.value === '::' && tokens[i + 2]?.value === 'make') {
      const resName = tokens[i].value;
      const firstArg = tokens[i + 3]?.value === '(' ? extractFirstArgument(tokens, i + 3) : undefined;
      return {
        descriptor: new ResourceResponseDescriptor({ resourceName: resName, shape: 'single' }),
        resourceName: resName,
        firstArg
      };
    }

    if (tokens[i]?.value === 'new' && tokens[i + 1]?.type === 'IDENTIFIER') {
      const resName = tokens[i + 1].value;
      if (resName.endsWith('Resource') || resName.endsWith('Collection') || (resName.charAt(0) === resName.charAt(0).toUpperCase() && resName.length > 2)) {
        const firstArg = tokens[i + 2]?.value === '(' ? extractFirstArgument(tokens, i + 2) : undefined;
        const shape = (resName.endsWith('Collection') || hasPaginate) ? 'collection' : 'single';
        return {
          descriptor: new ResourceResponseDescriptor({ resourceName: resName, shape }),
          resourceName: resName,
          firstArg
        };
      }
    }
  }

  return undefined;
}
