/**
 * fieldResolver.ts
 *
 * Recursive field resolver for AST nodes and expressions.
 *
 * @module cli/utils/incremental/fieldResolver
 */

import { SourceRef } from '@routesync/core';
import { PhpCodeParser } from '../../parsers/PhpCodeParser';
import { canonicalizeCollectionDescriptor } from './collectionCanonicalizer';
import { ScannedModel, ScannedResource, KernelResolver } from './incrementalTypes';

export type IRNodeRegistrar = (
  id: string,
  source: SourceRef,
  rawCode: string,
  resolved: Record<string, unknown>,
  lineage: string[]
) => void;

export type FieldResolverFn = (
  field: Record<string, unknown> | undefined | null,
  contextModel: ScannedModel | ScannedResource | undefined | null,
  assignments: Record<string, unknown> | undefined,
  resolvedAssignments: Record<string, unknown> | undefined,
  idPath: string,
  source: SourceRef,
  lineage: string[]
) => Record<string, unknown> | undefined | null;

export function createFieldResolver(
  kernel: KernelResolver,
  registerIRNode: IRNodeRegistrar
): FieldResolverFn {
  const resolveField: FieldResolverFn = (
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

    if (field.kind === 'array' && field.element && typeof field.element === 'object') {
      field.element = resolveField(
        field.element as Record<string, unknown>,
        contextModel,
        assignments,
        resolvedAssignments,
        `${idPath}.element`,
        source,
        [...lineage, idPath]
      );
      return canonicalizeCollectionDescriptor(field);
    }

    let target: Record<string, unknown> = field;
    if (field.kind === 'raw_code' && typeof field.code === 'string') {
      const parsedField = PhpCodeParser.parseExpression(field.code, field.hints as Record<string, unknown>);
      target = parsedField as unknown as Record<string, unknown>;
    }

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

    return canonicalizeCollectionDescriptor(target);
  };

  return resolveField;
}
