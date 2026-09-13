/**
 * methodCallHandler.ts
 *
 * Handles resolution for method_call AST nodes.
 *
 * @module cli/resolvers/plugins/method-return
 */

import type { SemanticResolution } from '@routesync/core';
import type { ResolutionContext } from '../types';

const MODEL_RETURN_METHODS = ['first', 'find', 'findOrFail', 'create', 'update', 'firstOrCreate'];
const COLLECTION_RETURN_METHODS = ['get', 'all'];
const PAGINATED_RETURN_METHODS = ['paginate', 'simplePaginate', 'cursorPaginate'];

export function resolveMethodCall(meta: any, context: ResolutionContext): SemanticResolution {
  const v = meta.variable;
  const m = meta.method;

  let targetModelName: string | undefined = undefined;
  let varStr = typeof v === 'string' ? v : JSON.stringify(v);

  if (typeof v === 'string') {
    if (v === 'request' && m === 'user') {
      return {
        status: 'resolved',
        type: 'model',
        model: 'User',
        confidence: 90,
        trace: [{
          source: 'MethodReturnResolver',
          rule: 'Request user helper method',
          input: 'request->user()',
          output: 'model: User'
        }]
      };
    }
    if (v === 'pdf' && m === 'download') {
      return {
        status: 'resolved',
        type: 'BinaryFile',
        confidence: 80,
        trace: [{
          source: 'MethodReturnResolver',
          rule: 'PDF download helper method',
          input: 'pdf->download()',
          output: 'BinaryFile'
        }]
      };
    }
    if (v === 'this' && context.contextModel) {
      targetModelName = context.contextModel.name;
    } else {
      const found = context.models.find((model: any) => model.name.toLowerCase() === v.toLowerCase());
      if (found) {
        targetModelName = found.name;
      }
    }
  } else if (typeof v === 'object' && v !== null) {
    const varRes = context.kernel.resolve(v, context.contextModel);
    if (varRes.status === 'resolved') {
      if (varRes.type === 'model' && varRes.model) {
        targetModelName = varRes.model;
      } else if (varRes.type && varRes.type !== 'unknown') {
        targetModelName = varRes.type;
      }
      if (v.kind === 'property_access') {
        varStr = `$this->${v.property}`;
      }
    }
  }

  if (targetModelName) {
    if (MODEL_RETURN_METHODS.includes(m)) {
      return {
        status: 'resolved',
        type: 'model',
        model: targetModelName,
        collection: false,
        confidence: 90,
        trace: [{
          source: 'MethodReturnResolver',
          rule: 'Query returns model instance',
          input: `${varStr}->${m}()`,
          output: `model: ${targetModelName}`
        }]
      };
    }

    if (COLLECTION_RETURN_METHODS.includes(m)) {
      return {
        status: 'resolved',
        type: 'model',
        model: targetModelName,
        collection: true,
        confidence: 90,
        trace: [{
          source: 'MethodReturnResolver',
          rule: 'Query returns collection of model',
          input: `${varStr}->${m}()`,
          output: `Collection of model: ${targetModelName}`
        }]
      };
    }

    if (PAGINATED_RETURN_METHODS.includes(m)) {
      return {
        status: 'resolved',
        type: 'model',
        model: targetModelName,
        collection: true,
        paginated: true,
        confidence: 90,
        trace: [{
          source: 'MethodReturnResolver',
          rule: 'Query returns paginated collection of model',
          input: `${varStr}->${m}()`,
          output: `Paginated Collection of model: ${targetModelName}`
        }]
      };
    }
  }

  if (m === 'createToken') {
    return {
      status: 'resolved',
      type: 'NewAccessToken',
      confidence: 80,
      trace: [{
        source: 'MethodReturnResolver',
        rule: 'Laravel Sanctum createToken helper',
        input: `${varStr}->createToken()`,
        output: 'NewAccessToken'
      }]
    };
  }

  return {
    status: 'unknown',
    type: 'unknown',
    confidence: meta.confidence || 0,
    trace: [{
      source: 'MethodReturnResolver',
      rule: 'Method return fallback',
      input: `${meta.variable}->${meta.method}()`,
      output: 'unknown'
    }]
  };
}
