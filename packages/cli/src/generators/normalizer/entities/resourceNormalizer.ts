/**
 * resourceNormalizer.ts
 *
 * Normalizes Laravel JsonResource manifests into NormalizedResource models.
 *
 * @module cli/generators/normalizer/entities
 */

import type {
  RouteManifest,
  SemanticResolutionKernel,
  FieldNode
} from '@routesync/core';
import { PhpCodeParser } from '../../../parsers/PhpCodeParser';
import type {
  NormalizedResource,
  NormalizedField,
  SemanticNode,
  RuntimeAugmented,
  ResolutionContext
} from '../normalizerTypes';
import { mapToNormalizedField } from '../fieldNormalizer';

export function normalizeResources(manifest: RouteManifest, kernel: SemanticResolutionKernel): NormalizedResource[] {
  const normalizedResources: NormalizedResource[] = [];
  if (!manifest.resources) return normalizedResources;

  manifest.resources.forEach(res => {
    const parsedAssignments: Record<string, unknown> = {};
    const resolvedAssignments: Record<string, SemanticNode> = {};
    const context: ResolutionContext = {
      layer: 'resource',
      fileName: res.name,
      modelMap: {},
      relationMap: {},
      assignments: parsedAssignments,
      resolvedAssignments: resolvedAssignments
    };

    if (res.assignments) {
      for (const varName in res.assignments) {
        const code = res.assignments[varName];
        const ast = PhpCodeParser.parseExpression(code, {});
        parsedAssignments[varName] = ast;
        const resolved = kernel.resolve(ast, context);
        if (resolved && resolved.status !== 'unknown') {
          resolvedAssignments[varName] = resolved as SemanticNode;
        }
      }
    }

    const patchField = (field: RuntimeAugmented) => {
      if (!field) return;
      if (field.kind === 'object' && field.fields) {
        Object.values(field.fields).forEach(f => patchField(f as RuntimeAugmented));
      } else {
        const meta = field.resolved || field.semantic;
        const ast = field.parsed_ast || (field.node && (field.node as RuntimeAugmented).parsed_ast)
          || (field.kind && field.kind !== 'object' && field.kind !== 'raw_code' ? field : null);
        if ((!meta || meta.status === 'unknown' || meta.type === 'unknown') && ast) {
          const resolved = kernel.resolve(ast as FieldNode, context);
          if (resolved && resolved.status !== 'unknown') {
            field.resolved = resolved;
          }
        }
      }
    };

    Object.values(res.fields).forEach((field: unknown) => {
      patchField(field as RuntimeAugmented);
    });

    // Map to NormalizedFields
    const fields: Record<string, NormalizedField> = {};
    const visited = new Set<string>();
    for (const [fieldName, fieldDef] of Object.entries(res.fields)) {
      fields[fieldName] = mapToNormalizedField(fieldDef, fieldName, visited);
    }

    normalizedResources.push({
      symbolId: `resource:${res.name}`,
      name: res.name,
      fields,
      loc: res.sourceFile ? { file: res.sourceFile, line: res.sourceLine || 1 } : undefined
    });
  });

  return normalizedResources;
}
