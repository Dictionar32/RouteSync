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
  ResourceResponseDescriptor,
  ModelResponseDescriptor,
  InlineResponseDescriptor,
  ResourceFieldDescriptor
} from '../../../../types/route';
import { LaravelSourceLexer } from '../../LaravelSourceLexer';
import { toPascalCase } from '../../../../utils/resource-naming';
import { ScannedResourceFieldDescriptor } from '../../descriptors/resourceDescriptors';
import { ResourceScanner } from '../ResourceScanner';

export function detectResourceResponse(
  tokens: readonly Token[],
  k: number
): ResponseDescriptor | undefined {
  if (tokens[k].value === 'return' && tokens[k + 1]?.type === 'IDENTIFIER' && tokens[k + 2]?.value === '::' && tokens[k + 3]?.value === 'collection') {
    const resName = tokens[k + 1].value;
    let hasPaginate = false;
    let scanAhead = k + 4;
    while (scanAhead < tokens.length && tokens[scanAhead].value !== ';') {
      if (tokens[scanAhead].value === 'paginate' || tokens[scanAhead].value === 'simplePaginate') {
        hasPaginate = true;
        break;
      }
      scanAhead++;
    }
    return new ResourceResponseDescriptor({
      resourceName: resName,
      shape: hasPaginate ? 'collection' : 'collection'
    });
  }

  if (tokens[k].value === 'return' && tokens[k + 1]?.value === 'new' && tokens[k + 2]?.type === 'IDENTIFIER') {
    const resName = tokens[k + 2].value;
    if (resName.endsWith('Resource') || resName.endsWith('Collection')) {
      return new ResourceResponseDescriptor({
        resourceName: resName,
        shape: resName.endsWith('Collection') ? 'collection' : 'single'
      });
    }
  }

  if (tokens[k].value === 'return' && tokens[k + 1]?.type === 'IDENTIFIER' && tokens[k + 2]?.value === '::' && tokens[k + 3]?.value === 'make') {
    return new ResourceResponseDescriptor({
      resourceName: tokens[k + 1].value,
      shape: 'single'
    });
  }

  return undefined;
}

export function detectModelResponse(
  tokens: readonly Token[],
  k: number
): ResponseDescriptor | undefined {
  if (tokens[k].value === 'return' && tokens[k + 1]?.type === 'IDENTIFIER' && tokens[k + 2]?.value === '::') {
    const modelOrClass = tokens[k + 1].value;
    const queryMethod = tokens[k + 3]?.value;
    if (queryMethod === 'all' || queryMethod === 'paginate' || queryMethod === 'get' || queryMethod === 'cursor') {
      return new ModelResponseDescriptor({
        modelName: modelOrClass,
        shape: 'collection'
      });
    }
    if (queryMethod === 'find' || queryMethod === 'findOrFail' || queryMethod === 'first' || queryMethod === 'firstOrFail' || queryMethod === 'create') {
      return new ModelResponseDescriptor({
        modelName: modelOrClass,
        shape: 'single'
      });
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
          let cleanDomain = actionName || 'Inline';
          if (['index', 'show', 'store', 'update', 'destroy'].includes(actionName || '')) {
            const baseCtrl = controllerName.replace(/Controller$/, '');
            cleanDomain = baseCtrl === 'Category' ? 'Categories' : baseCtrl === 'ProductReview' ? 'ProdukReviews' : baseCtrl === 'Order' ? 'Orders' : baseCtrl;
          } else if (actionName) {
            cleanDomain = actionName.charAt(0).toUpperCase() + actionName.slice(1);
          }
          const rawDomain = cleanDomain;
          const fields: ResourceFieldDescriptor[] = parsedArray.entries.map(e => {
            const mapped = ResourceScanner.mapAstValueToExpression(e.value, e.rawExpression);
            return ScannedResourceFieldDescriptor.fromExpression(
              e.key,
              mapped.expression,
              mapped.nullable
            );
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
