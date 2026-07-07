import fs from 'fs-extra'
import crypto from 'crypto'
import { PhpCodeParser } from '../parsers/PhpCodeParser'

export interface ScannedRoute {
  method: string;
  path: string;
  auth: boolean;
  schema?: Record<string, unknown> | null;
  response?: Record<string, unknown> | null;
  assignments?: Record<string, string> | null;
  stableHash?: string;
  name?: string;
}

export interface ScannedModel {
  name: string;
  accessors?: Record<string, {
    expression?: unknown;
    type?: string;
    expression_code?: string | null;
    parsed_ast?: unknown;
  }>;
}

export interface ScannedResource {
  name: string;
  model?: string;
  assignments?: Record<string, string>;
  fields?: Record<string, unknown>;
}

export interface ScannedManifest {
  routes?: ScannedRoute[];
  models?: ScannedModel[];
  resources?: ScannedResource[];
}

export function calculateRouteHash(route: ScannedRoute): string {
  const replacer = (key: string, value: unknown) => {
    if (key === 'resolved' || key === 'parsed_ast') return undefined
    return value
  }
  const content = JSON.stringify({
    method: route.method,
    path: route.path,
    auth: route.auth,
    schema: route.schema || null,
    response: route.response || null,
    assignments: route.assignments || null
  }, replacer)
  return crypto.createHash('sha256').update(content).digest('hex')
}

interface KernelResolver {
  resolve(ast: unknown, context: Record<string, unknown>): {
    status: string;
    type?: string;
    confidence?: number;
    trace?: Array<Record<string, unknown>>;
  };
}

export function resolveManifestIncrementally(
  newManifest: ScannedManifest,
  prevManifestPath: string,
  kernel: KernelResolver,
  models: ScannedModel[] | undefined
): ScannedManifest {
  let prevManifest: ScannedManifest | null = null
  if (fs.existsSync(prevManifestPath)) {
    try {
      prevManifest = fs.readJsonSync(prevManifestPath)
    } catch (e) {
      // ignore JSON parsing errors
    }
  }

  const resolvedManifest = JSON.parse(JSON.stringify(newManifest)) as ScannedManifest

  const prevRouteMap = new Map<string, ScannedRoute>()
  if (prevManifest && prevManifest.routes) {
    prevManifest.routes.forEach((r: ScannedRoute) => {
      prevRouteMap.set(`${r.method}:${r.path}`, r)
    })
  }

  const resolveField = (
    field: Record<string, unknown> | undefined | null,
    contextModel: ScannedModel | ScannedResource | undefined | null,
    assignments?: Record<string, unknown>,
    resolvedAssignments?: Record<string, unknown>
  ): Record<string, unknown> | undefined | null => {
    if (!field) return field;
    
    if (field.kind === 'object' && field.fields) {
      const fields = field.fields as Record<string, unknown>;
      for (const key in fields) {
        fields[key] = resolveField(fields[key] as Record<string, unknown>, contextModel, assignments, resolvedAssignments);
      }
      return field;
    }

    let astToResolve: unknown = field;
    if (field.kind === 'raw_code' && typeof field.code === 'string') {
       const parsedAst = PhpCodeParser.parseExpression(field.code, field.hints as Record<string, unknown>);
       field.parsed_ast = parsedAst;
       astToResolve = parsedAst;
    }

    const context = {
      modelMap: {},
      relationMap: {},
      layer: 'resource',
      fileName: contextModel ? `${contextModel.name}Resource` : undefined,
      assignments: assignments || {},
      resolvedAssignments: resolvedAssignments || {}
    };

    const resolved = kernel.resolve(astToResolve, context);
    if (resolved && resolved.status !== 'unknown') {
       field.resolved = resolved as unknown as Record<string, unknown>;
    }

    return field;
  }

  // Resolve Model Accessors
  if (resolvedManifest.models) {
    resolvedManifest.models.forEach((model: ScannedModel) => {
      if (model.accessors) {
        for (const key in model.accessors) {
          const accessor = model.accessors[key];
          if (accessor) {
            let resolved: Record<string, unknown> | null = null;
            let parsedAst: unknown = null;
            let exprCode = accessor.expression_code || null;

            if (typeof exprCode === 'string' && exprCode.trim()) {
              parsedAst = PhpCodeParser.parseExpression(exprCode);
              const context = {
                layer: 'model',
                fileName: model.name,
                modelMap: {},
                relationMap: {},
                assignments: {}
              };
              resolved = kernel.resolve(parsedAst, context);
            }

            if ((!resolved || resolved.status === 'unknown') && accessor.type && accessor.type !== 'mixed') {
              resolved = {
                status: 'resolved',
                type: accessor.type,
                confidence: 100,
                trace: [{ source: 'ReflectionScanner', input: key, output: accessor.type, rule: 'Reflection return type signature' }]
              };
            }

            if (!resolved) {
              resolved = {
                status: 'unknown',
                type: 'unknown',
                confidence: 0,
                trace: []
              };
            }

            model.accessors[key] = {
              expression_code: exprCode,
              parsed_ast: parsedAst,
              expression: resolved
            };
          }
        }
      }
    });
  }

  // Resolve Resources
  if (resolvedManifest.resources) {
    resolvedManifest.resources.forEach((res: ScannedResource) => {
      let contextModel = models ? models.find((m: ScannedModel) => m.name === res.model) : null;
      if (!contextModel && res.name.endsWith('Resource')) {
          contextModel = models ? models.find((m: ScannedModel) => m.name === res.name.replace('Resource', '')) : null;
      }

      const parsedAssignments: Record<string, unknown> = {};
      const resolvedAssignments: Record<string, unknown> = {};
      const contextForAssignments = {
        modelMap: {},
        relationMap: {},
        layer: 'resource',
        fileName: contextModel ? `${contextModel.name}Resource` : (res.name.endsWith('Resource') ? res.name : `${res.name}Resource`),
        assignments: parsedAssignments,
        resolvedAssignments: resolvedAssignments
      };

      if (res.assignments) {
        for (const varName in res.assignments) {
          const code = res.assignments[varName];
          const ast = PhpCodeParser.parseExpression(code, {});
          parsedAssignments[varName] = ast;
          const resolved = kernel.resolve(ast, contextForAssignments);
          if (resolved && resolved.status !== 'unknown') {
            resolvedAssignments[varName] = resolved;
          }
        }
      }

      if (res.fields) {
        for (const key in res.fields) {
          res.fields[key] = resolveField(res.fields[key] as Record<string, unknown>, contextModel || res, parsedAssignments, resolvedAssignments) as Record<string, unknown>;
        }
      }
    })
  }

  // Resolve Routes Incrementally
  if (resolvedManifest.routes) {
    resolvedManifest.routes.forEach((route: ScannedRoute) => {
      const hash = calculateRouteHash(route)
      route.stableHash = hash

      const cachedRoute = prevRouteMap.get(`${route.method}:${route.path}`)
      if (cachedRoute && cachedRoute.stableHash === hash) {
        route.response = cachedRoute.response
        route.assignments = cachedRoute.assignments
        return
      }

      const parsedAssignments: Record<string, unknown> = {};
      const resolvedAssignments: Record<string, unknown> = {};
      const contextForAssignments = {
        modelMap: {},
        relationMap: {},
        layer: 'route',
        fileName: route.name,
        assignments: parsedAssignments,
        resolvedAssignments: resolvedAssignments
      };

      if (route.assignments) {
        for (const varName in route.assignments) {
          const code = route.assignments[varName];
          const ast = PhpCodeParser.parseExpression(code, {});
          parsedAssignments[varName] = ast;
          const resolved = kernel.resolve(ast, contextForAssignments);
          if (resolved && resolved.status !== 'unknown') {
            resolvedAssignments[varName] = resolved;
          }
        }
      }

      if (route.response && route.response.kind !== 'primitive' && route.response.kind !== 'object' && route.response.kind !== 'array') {
         route.response = resolveField(route.response as Record<string, unknown>, null, parsedAssignments, resolvedAssignments) as Record<string, unknown>;
      } else if (route.response && route.response.kind === 'object' && route.response.fields) {
         const fields = route.response.fields as Record<string, unknown>;
         for (const key in fields) {
            const field = fields[key] as Record<string, unknown>;
            if (field.kind && field.kind !== 'primitive') {
               fields[key] = resolveField(field, null, parsedAssignments, resolvedAssignments) as Record<string, unknown>;
            }
          }
      }
    })
  }

  return resolvedManifest
}
