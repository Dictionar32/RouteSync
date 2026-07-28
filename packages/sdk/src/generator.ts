import { RouteManifest, ParsedRoute, GeneratedSDKModule, RequestContract, ResponseContract, ZodContract, ReactQueryHooks, SemanticIRNode, ParsedResource, ZodAST } from '@routesync/core'
import { isObject, hasProperty, isString } from '../../core/src/utils/type-guards'

export class ZodEmitter {
  static from(node: SemanticIRNode | undefined, resources: ParsedResource[] = []): ZodAST {
    if (!node || !node.semantic) return { kind: "zod_unknown" };

    // Safe type checking untuk semantic type
    const semanticType = node.semantic.type
    if (semanticType === "model" || (isObject(node.semantic) &&
      hasProperty(node.semantic, 'type') && node.semantic.type === "object")) {
      let shape = {};
      if (node.semantic.model) {
        const resource = resources.find(r => r.name === node.semantic!.model || r.name === node.semantic!.model + 'Resource');
        if (resource) {
          shape = this.fromObject(resource.fields, resources);
        }
      }
      return { kind: "zod_object", shape };
    }

    if (node.semantic.type === "number") return { kind: "zod_number" };
    if (node.semantic.type === "string") return { kind: "zod_string" };
    if (node.semantic.type === "boolean") return { kind: "zod_boolean" };
    if (node.semantic.type === "array" || node.semantic.collection) {
      return { kind: "zod_array", element: { kind: "zod_unknown" } };
    }

    return { kind: "zod_unknown" };
  }

  static fromObject(fields: Record<string, unknown>, resources: ParsedResource[]): Record<string, ZodAST> {
    const shape: Record<string, ZodAST> = {};
    for (const [key, value] of Object.entries(fields)) {
      if (value && value.semantic) {
        shape[key] = this.from(value as SemanticIRNode, resources);
      } else {
        shape[key] = { kind: "zod_unknown" };
      }
    }
    return shape;
  }
}

export class ReactQueryEmitter {
  static from(node: SemanticIRNode, routeName: string, pathParams: string[]): ReactQueryHooks {
    const key = [routeName, ...pathParams];
    const isGet = node.meta?.tags?.includes('GET') ?? true;

    return {
      key,
      useQuery: isGet ? `use${this.capitalize(routeName)}` : undefined,
      useMutation: !isGet ? `use${this.capitalize(routeName)}Mutation` : undefined,
    };
  }

  private static capitalize(s: string) {
    return s.charAt(0).toUpperCase() + s.slice(1);
  }
}

export class SdkGenerator {
  public static generate(manifest: RouteManifest): GeneratedSDKModule[] {
    const modules: GeneratedSDKModule[] = [];

    for (const route of manifest.routes) {
      const module = this.generateForRoute(route, manifest.resources || []);
      if (module) {
        modules.push(module);
      }
    }

    return modules;
  }

  private static generateForRoute(route: ParsedRoute, resources: ParsedResource[]): GeneratedSDKModule | null {
    const routeName = route.name || route.path.replace(/[^a-zA-Z0-9_]/g, '_');

    // Request Contract (Params from path)
    const request: RequestContract = { params: {} };
    const pathParams = [...route.path.matchAll(/\{([^}]+)\}/g)];
    for (const match of pathParams) {
      request.params![match[1]] = 'string';
    }

    let responseContract: ResponseContract = {
      type: 'primitive',
      schema: { kind: "zod_unknown" },
      semantic: { status: 'unknown', type: 'unknown', confidence: 0, trace: [] },
      confidence: 0
    };

    const zodContract: ZodContract = { ast: { kind: "zod_unknown" }, imports: ['z'] };

    let irNodeForEmitters: SemanticIRNode | undefined = undefined;

    if (route.response) {
      // Safe type checking untuk response dengan semantic
      if (isObject(route.response) && hasProperty(route.response, 'semantic')) {
        const responseWithSemantic = route.response as { semantic: any }

        // Create IR node dengan safe type conversion
        const irNode: SemanticIRNode = {
          id: routeName,
          source: { file: '', context: 'route' },
          node: { kind: 'raw_code', code: '' },
          semantic: responseWithSemantic.semantic,
          meta: { version: "ir.v2", stableHash: "", lineage: [], tags: [route.method] }
        }

        irNodeForEmitters = irNode
        responseContract.semantic = irNode.semantic
        responseContract.confidence = irNode.semantic.confidence
        responseContract.type = 'model'
        zodContract.ast = ZodEmitter.from(irNode, resources)
      } else if (route.response.kind === 'resource') {
        const resourceName = route.response.resource;
        const resourceDef = resources.find(r => r.name === resourceName);
        if (resourceDef) {
          zodContract.ast = { kind: "zod_object", shape: ZodEmitter.fromObject(resourceDef.fields, resources) };
          responseContract.type = route.response.collection ? 'array' : 'object';
        }
      } else if (route.response.kind === 'object') {
        zodContract.ast = { kind: "zod_object", shape: ZodEmitter.fromObject(route.response.fields, resources) };
        responseContract.type = 'object';
      }
    }

    // fallback IR node to emit meta tags
    if (!irNodeForEmitters) {
      irNodeForEmitters = {
        id: routeName,
        source: { file: '', context: 'route' },
        node: { kind: 'raw_code', code: '' },
        semantic: responseContract.semantic,
        meta: { version: "ir.v2", stableHash: "", lineage: [], tags: [route.method] }
      } as SemanticIRNode;
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
}
