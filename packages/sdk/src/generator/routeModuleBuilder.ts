/**
 * routeModuleBuilder.ts
 *
 * Generates SDK module descriptors for individual parsed routes.
 *
 * @module sdk/generator
 */

import {
  type ParsedRoute,
  type GeneratedSDKModule,
  type RequestContract,
  type ResponseContract,
  type ZodContract,
  type SemanticIRNode,
  type ParsedResource,
  ZodObjectShape,
  SourceRefFactory,
  IRRawNodeDescriptor,
  isObject,
  hasProperty
} from '@routesync/core';
import { ZodEmitter } from './zodEmitter';
import { ReactQueryEmitter } from './reactQueryEmitter';

export function generateModuleForRoute(
  route: ParsedRoute,
  resources: readonly ParsedResource[]
): GeneratedSDKModule | null {
  const routeName = route.name || route.path.replace(/[^a-zA-Z0-9_]/g, '_');

  const request: RequestContract = { params: {} };
  const pathParams = [...route.path.matchAll(/\{([^}]+)\}/g)];
  for (const match of pathParams) {
    request.params![match[1]] = 'string';
  }

  const responseContract: ResponseContract = {
    type: 'primitive',
    schema: { kind: "zod_unknown" },
    semantic: { status: 'unknown', type: 'unknown', confidence: 0, trace: [] },
    confidence: 0
  };

  const zodContract: ZodContract = { ast: { kind: "zod_unknown" }, imports: ['z'] };
  let irNodeForEmitters: SemanticIRNode | undefined = undefined;

  if (route.response) {
    if (isObject(route.response) && hasProperty(route.response, 'semantic')) {
      const responseWithSemantic = route.response as { semantic: any };

      const irNode: SemanticIRNode = {
        id: routeName,
        source: SourceRefFactory.unknown('', 'route'),
        node: IRRawNodeDescriptor.fromRawCode(''),
        semantic: responseWithSemantic.semantic,
        meta: { version: "ir.v2", stableHash: "", lineage: [], tags: [route.method] }
      };

      irNodeForEmitters = irNode;
      responseContract.semantic = irNode.semantic;
      responseContract.confidence = irNode.semantic.confidence;
      responseContract.type = 'model';
      zodContract.ast = ZodEmitter.from(irNode, resources);
    } else if (route.response.kind === 'resource') {
      const resourceName = route.response.resourceName;
      const resourceDef = resources.find(r => r.name === resourceName);
      if (resourceDef) {
        zodContract.ast = { kind: "zod_object", shape: ZodObjectShape.fromRecord(ZodEmitter.fromObject(resourceDef.fields, resources)) };
        responseContract.type = route.response.shape === 'collection' || route.response.shape === 'paginated' ? 'array' : 'object';
      }
    }
  }

  if (!irNodeForEmitters) {
    irNodeForEmitters = {
      id: routeName,
      source: SourceRefFactory.unknown('', 'route'),
      node: IRRawNodeDescriptor.fromRawCode(''),
      semantic: responseContract.semantic,
      meta: { version: "ir.v2", stableHash: "", lineage: [], tags: [route.method] }
    };
  } else {
    irNodeForEmitters.meta = { ...irNodeForEmitters.meta, tags: [route.method] };
  }

  const hooks = ReactQueryEmitter.from(irNodeForEmitters, routeName, pathParams.map(m => m[1]));

  return {
    routeName,
    endpoint: route.path,
    method: route.method as 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE',
    request,
    response: responseContract,
    hooks,
    zod: zodContract
  };
}
