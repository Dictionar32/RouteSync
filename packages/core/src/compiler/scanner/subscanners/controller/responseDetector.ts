/**
 * responseDetector.ts
 *
 * Detects response descriptors (Resource, Model, Inline) from controller action AST tokens.
 *
 * @module core/compiler/scanner/subscanners/controller
 */

import type { Token } from '../lexer/types';
import {
  ResponseDescriptor,
  ModelResponseDescriptor,
  InlineResponseDescriptor,
  ResourceFieldDescriptor
} from '../../../../types/route';
import { LaravelSourceLexer } from '../../LaravelSourceLexer';
import { toPascalCase } from '../../../../utils/resource-naming';
import { ScannedResourceFieldDescriptor } from '../../descriptors/resourceDescriptors';
import { ResourceScanner } from '../ResourceScanner';
import { ErrorType } from '../../../types/SemanticType';
import {
  DetectedResourceInvocation,
  detectResourceInvocation
} from './resourceInvocationDetector';

export { DetectedResourceInvocation, detectResourceInvocation };

export function detectResourceResponse(
  tokens: readonly Token[],
  k: number
): ResponseDescriptor | undefined {
  return detectResourceInvocation(tokens, k)?.descriptor;
}

export function detectModelResponse(
  tokens: readonly Token[],
  k: number
): ResponseDescriptor | undefined {
  if (tokens[k].value === 'return' && tokens[k + 1]?.type === 'IDENTIFIER' && tokens[k + 2]?.value === '::') {
    const modelOrClass = tokens[k + 1].value;
    const queryMethod = tokens[k + 3]?.value;
    if (queryMethod === 'all' || queryMethod === 'paginate' || queryMethod === 'get' || queryMethod === 'cursor') {
      return new ModelResponseDescriptor({ modelName: modelOrClass, shape: 'collection' });
    }
    if (queryMethod === 'find' || queryMethod === 'findOrFail' || queryMethod === 'first' || queryMethod === 'firstOrFail' || queryMethod === 'create') {
      return new ModelResponseDescriptor({ modelName: modelOrClass, shape: 'single' });
    }
  }
  return undefined;
}

export function detectInlineResponse(
  source: string,
  tokens: readonly Token[],
  k: number,
  controllerName: string,
  actionName: string
): ResponseDescriptor | undefined {
  if (tokens[k].value === 'return' && tokens[k + 1]?.value === 'response' && tokens[k + 2]?.value === '(') {
    let jIdx = k + 3;
    while (jIdx < tokens.length && tokens[jIdx].value !== ';') {
      if (tokens[jIdx].value === 'json' && tokens[jIdx + 1]?.value === '(') {
        const parsedArray = LaravelSourceLexer.parseArray(source, tokens as Token[], jIdx + 1);
        if (parsedArray.entries.length > 0) {
          const rawDomain = resolveInlineDomain(controllerName, actionName);
          const fields: ResourceFieldDescriptor[] = parsedArray.entries.map(e => {
            const mapped = ResourceScanner.mapAstValueToExpression(e.value);
            const semanticType = mapped.semantic.kind === 'known'
              ? mapped.semantic.type
              : new ErrorType('Inline response field requires verified semantic binding');
            return ScannedResourceFieldDescriptor.fromExpression(e.key, mapped.expression, semanticType);
          });
          return new InlineResponseDescriptor({
            domain: rawDomain,
            baseName: toPascalCase(rawDomain),
            typeName: `${toPascalCase(rawDomain)}Transformed`,
            fields,
            shape: 'single'
          });
        }
        break;
      }
      jIdx++;
    }
  }
  return undefined;
}

function resolveInlineDomain(controllerName: string, actionName: string): string {
  if (['index', 'show', 'store', 'update', 'destroy'].includes(actionName || '')) {
    const baseCtrl = controllerName.replace(/Controller$/, '');
    if (baseCtrl === 'Category') return 'Categories';
    if (baseCtrl === 'ProductReview') return 'ProdukReviews';
    if (baseCtrl === 'Order') return 'Orders';
    return baseCtrl;
  }
  return actionName ? actionName.charAt(0).toUpperCase() + actionName.slice(1) : 'Inline';
}
