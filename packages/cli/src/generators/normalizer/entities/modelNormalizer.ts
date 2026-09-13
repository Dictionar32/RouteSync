/**
 * modelNormalizer.ts
 *
 * Normalizes Eloquent models into NormalizedModel models.
 *
 * @module cli/generators/normalizer/entities
 */

import {
  type RouteManifest,
  type SemanticResolutionKernel,
  DATABASE_COLUMN_KIND_REGISTRY
} from '@routesync/core';
import type {
  NormalizedModel,
  NormalizedField,
  NormalizedAccessor
} from '../normalizerTypes';
import { normalizeAccessor } from '../fieldNormalizer';

export function normalizeModels(manifest: RouteManifest, _kernel?: SemanticResolutionKernel): NormalizedModel[] {
  const normalizedModels: NormalizedModel[] = [];
  if (!manifest.models) return normalizedModels;

  manifest.models.forEach(m => {
    const fields: Record<string, NormalizedField> = {};
    const casts = m.casts || {};

    m.columns.forEach(col => {
      let type: "string" | "number" | "boolean" | "null" = "string";
      if (col.columnKind && DATABASE_COLUMN_KIND_REGISTRY[col.columnKind]) {
        const regType = DATABASE_COLUMN_KIND_REGISTRY[col.columnKind].tsType;
        if (regType === 'number' || regType === 'boolean') {
          type = regType;
        }
      } else {
        const lower = col.type.toLowerCase();
        if (lower.includes('int') || lower.includes('float') || lower.includes('double') || lower.includes('decimal')) type = 'number';
        else if (lower.includes('bool') || lower.includes('tinyint(1)')) type = 'boolean';
      }

      const castType = casts[col.name];
      if (castType) {
        const lowerCast = castType.toLowerCase();
        if (lowerCast.includes('int') || lowerCast.includes('float') || lowerCast.includes('double') || lowerCast.includes('real')) type = 'number';
        else if (lowerCast.includes('bool') || lowerCast === 'boolean') type = 'boolean';
        else if (lowerCast === 'array' || lowerCast === 'json' || lowerCast === 'object' || lowerCast === 'collection') type = 'string';
      }

      fields[col.name] = {
        kind: "primitive",
        type,
        nullable: !!col.nullable
      };
    });

    const accessors: Record<string, NormalizedAccessor> = {};
    const visited = new Set<string>();
    if (m.accessors) {
      for (const [accName, accDef] of Object.entries(m.accessors)) {
        accessors[accName] = normalizeAccessor(accName, accDef, accName, visited);
      }
    }

    normalizedModels.push({
      symbolId: `model:${m.name}`,
      name: m.name,
      tableName: m.table,
      fields,
      accessors,
      appends: m.appends
    });
  });

  return normalizedModels;
}
