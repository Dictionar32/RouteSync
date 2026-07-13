import fs from 'fs-extra'
import path from 'path'
import crypto from 'crypto'
import { PhpCodeParser } from '../parsers/PhpCodeParser'
import { buildSemanticIRNode, IRNodeRegistry, SemanticIRNode, SemanticNode, SourceRef } from '@routesync/core'

export interface ScannedRoute {
  method: string;
  path: string;
  auth: boolean;
  schema?: Record<string, unknown> | null;
  response?: Record<string, unknown> | null;
  assignments?: Record<string, string> | null;
  stableHash?: string;
  name?: string;
  sourceFile?: string | null;
  sourceLine?: number | null;
}

export interface ScannedModel {
  name: string;
  accessors?: Record<string, {
    // input, from the PHP scanner (LaravelRouteParser.ts emits 'expression', not 'expression_code'):
    type?: string;
    expression?: string | null;
    expression_code?: string | null;
    sourceFile?: string | null;
    sourceLine?: number | null;
    // output, written by resolveManifestIncrementally below:
    ast?: unknown;
    semantic?: unknown;
    source?: { file: string; line?: number };
  }>;
}

export interface ScannedResource {
  name: string;
  model?: string;
  assignments?: Record<string, string>;
  fields?: Record<string, unknown>;
  sourceFile?: string | null;
  sourceLine?: number | null;
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
  getModels?(): Record<string, unknown>[];
}

export interface ResolveManifestResult {
  manifest: ScannedManifest
  /** Stage 2 (IR v3) output — every resolved field as a real, addressable SemanticIRNode. */
  irRegistry: IRNodeRegistry
}

export function resolveManifestIncrementally(
  newManifest: ScannedManifest,
  prevManifestPath: string,
  kernel: KernelResolver,
  models: ScannedModel[] | undefined
): ResolveManifestResult {
  let prevManifest: ScannedManifest | null = null
  if (fs.existsSync(prevManifestPath)) {
    try {
      prevManifest = fs.readJsonSync(prevManifestPath)
    } catch (e) {
      // ignore JSON parsing errors
    }
  }

  const resolvedManifest = JSON.parse(JSON.stringify(newManifest)) as ScannedManifest
  const irRegistry = new IRNodeRegistry()

  // Cache-hit routes below skip re-resolution entirely, which means they'd
  // never call registerIRNode this run. Without this, routesync.ir.json
  // would shrink on every incremental scan instead of staying complete —
  // load prior nodes so a cache-hit route keeps the IR nodes it already had.
  let prevIRNodes: Record<string, SemanticIRNode> = {}
  const prevIRPath = path.resolve(path.dirname(prevManifestPath), 'routesync.ir.json')
  if (fs.existsSync(prevIRPath)) {
    try {
      const prevIR = fs.readJsonSync(prevIRPath)
      prevIRNodes = prevIR?.nodes || {}
    } catch (e) {
      // ignore JSON parsing errors
    }
  }

  const prevRouteMap = new Map<string, ScannedRoute>()
  if (prevManifest && prevManifest.routes) {
    prevManifest.routes.forEach((r: ScannedRoute) => {
      prevRouteMap.set(`${r.method}:${r.path}`, r)
    })
  }

  // Registers a resolved field as a real SemanticIRNode. `id` must be a
  // unique, deterministic path (see call sites) — it is what stages 3-6
  // (CompilerRoadmap.md) key off, so it has to be stable across scans, not
  // just unique within one.
  const registerIRNode = (
    id: string,
    source: SourceRef,
    rawCode: string,
    resolved: Record<string, unknown>,
    lineage: string[]
  ) => {
    irRegistry.add(
      buildSemanticIRNode({
        id,
        source,
        rawCode,
        semantic: resolved as unknown as SemanticNode,
        lineage,
      })
    )
  }

  const resolveField = (
    field: Record<string, unknown> | undefined | null,
    contextModel: ScannedModel | ScannedResource | undefined | null,
    assignments: Record<string, unknown> | undefined,
    resolvedAssignments: Record<string, unknown> | undefined,
    idPath: string,
    source: SourceRef,
    lineage: string[]
  ): Record<string, unknown> | undefined | null => {
    if (!field) return field;
    
    if (field.kind === 'object' && field.fields) {
      const fields = field.fields as Record<string, unknown>;
      for (const key in fields) {
        fields[key] = resolveField(
          fields[key] as Record<string, unknown>,
          contextModel,
          assignments,
          resolvedAssignments,
          `${idPath}.fields.${key}`,
          source,
          [...lineage, idPath]
        );
      }
      return field;
    }

    let target: Record<string, unknown> = field;
    if (field.kind === 'raw_code' && typeof field.code === 'string') {
       const parsedField = PhpCodeParser.parseExpression(field.code, field.hints as Record<string, unknown>);
       // The raw_code node is replaced by its parsed form in the tree —
       // it must not survive as a wrapper holding a nested parsed_ast
       // (see design review: "RawCodeField should always disappear after
       // the parser"). ZodTierGenerator's on-the-fly retry resolution was
       // updated to match — it now falls back to using the field itself
       // when there's no separate parsed_ast to find.
       target = parsedField as unknown as Record<string, unknown>;
    }
    // Every ParsedField carries its own originalCode (field.ts) — falling
    // back to that instead of only trusting the raw_code branch means the
    // IR's source expression survives even if a field ever arrives already
    // parsed (a different producer, a future caller, etc.), not just when
    // resolveField itself did the parsing.
    const rawCode = field.kind === 'raw_code' && typeof field.code === 'string'
      ? field.code
      : (typeof target.originalCode === 'string' ? target.originalCode : '');

    const context = {
      modelMap: {},
      relationMap: {},
      layer: 'resource',
      fileName: contextModel ? `${contextModel.name}Resource` : undefined,
      assignments: assignments || {},
      resolvedAssignments: resolvedAssignments || {}
    };

    const resolved = kernel.resolve(target, context);
    if (resolved && resolved.status !== 'unknown') {
       target.resolved = resolved as unknown as Record<string, unknown>;
       registerIRNode(idPath, source, rawCode, resolved, lineage);
    }

    return target;
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
            let exprCode = accessor.expression || accessor.expression_code || null;

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
              source: { file: accessor.sourceFile ?? '', line: accessor.sourceLine ?? undefined },
              ast: parsedAst,
              semantic: resolved
            };

            if (resolved.status !== 'unknown') {
              registerIRNode(
                `model:${model.name}#accessors.${key}`,
                { file: accessor.sourceFile ?? '', line: accessor.sourceLine ?? undefined, context: 'model' },
                typeof exprCode === 'string' ? exprCode : '',
                resolved,
                [`model:${model.name}`]
              );
            }
          }
        }
      }
    });

    // Sync resolved accessors back to the kernel's model graph
    if (kernel.getModels) {
      const kernelModels = kernel.getModels();
      resolvedManifest.models.forEach((model: ScannedModel) => {
        if (model.accessors) {
          const target = kernelModels.find((m: Record<string, unknown>) => m.name === model.name);
          if (target) {
            target.accessors = model.accessors;
          }
        }
      });
    }
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

      const resourceSource: SourceRef = { file: res.sourceFile ?? '', line: res.sourceLine ?? undefined, context: 'resource' };
      if (res.fields) {
        for (const key in res.fields) {
          res.fields[key] = resolveField(
            res.fields[key] as Record<string, unknown>,
            contextModel || res,
            parsedAssignments,
            resolvedAssignments,
            `resource:${res.name}#fields.${key}`,
            resourceSource,
            [`resource:${res.name}`]
          ) as Record<string, unknown>;
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

        const cachedRouteId = `route:${route.method}:${route.path}`
        for (const [nodeId, node] of Object.entries(prevIRNodes)) {
          if (nodeId === cachedRouteId || nodeId.startsWith(`${cachedRouteId}#`)) {
            irRegistry.add(node)
          }
        }
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

      // Real source location from ReflectionMethod (packages/cli/src/parsers/LaravelRouteParser.ts),
      // not a placeholder — null only when the action genuinely has no
      // reflectable location (e.g. a route closure).
      const routeSource: SourceRef = {
        file: route.sourceFile ?? '',
        line: route.sourceLine ?? undefined,
        context: 'route',
      };
      const routeId = `route:${route.method}:${route.path}`;

      if (route.response && route.response.kind !== 'primitive' && route.response.kind !== 'object' && route.response.kind !== 'array') {
         route.response = resolveField(
           route.response as Record<string, unknown>,
           null,
           parsedAssignments,
           resolvedAssignments,
           `${routeId}#response`,
           routeSource,
           [routeId]
         ) as Record<string, unknown>;
      } else if (route.response && route.response.kind === 'object' && route.response.fields) {
         const fields = route.response.fields as Record<string, unknown>;
         for (const key in fields) {
            const field = fields[key] as Record<string, unknown>;
            if (field.kind && field.kind !== 'primitive') {
               fields[key] = resolveField(
                 field,
                 null,
                 parsedAssignments,
                 resolvedAssignments,
                 `${routeId}#response.fields.${key}`,
                 routeSource,
                 [routeId]
               ) as Record<string, unknown>;
            }
          }
      }
    })
  }

  return { manifest: resolvedManifest, irRegistry }
}
