/**
 * resourceResolver.ts
 *
 * Resolves API resources and their fields against models and expressions.
 *
 * @module cli/utils/incremental/resourceResolver
 */

import { SourceRef } from '@routesync/core';
import { PhpCodeParser } from '../../parsers/PhpCodeParser';
import { ScannedManifest, ScannedModel, ScannedResource, KernelResolver } from './incrementalTypes';
import { FieldResolverFn } from './fieldResolver';

export function resolveResources(
  manifest: ScannedManifest,
  models: ScannedModel[] | undefined,
  kernel: KernelResolver,
  resolveField: FieldResolverFn
): void {
  if (!manifest.resources) return;

  manifest.resources.forEach((res: ScannedResource) => {
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
  });
}
