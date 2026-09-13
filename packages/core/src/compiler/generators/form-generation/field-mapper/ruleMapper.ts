/**
 * ruleMapper.ts
 *
 * Maps array of ValidationRule into MappedField with SemanticType and file constraints.
 *
 * @module core/compiler/generators/form-generation/field-mapper
 */

import {
  PrimitiveType,
  PrimitiveKind,
  ReadonlyCollectionType,
  CollectionKind,
  type SemanticType
} from '../../../types/SemanticType';
import type { ValidationRule, MappedField } from './types';

export function mapRulesToField(rules: readonly ValidationRule[]): MappedField {
  let baseType: SemanticType = new PrimitiveType(PrimitiveKind.STRING);
  let required = false;
  let nullable = false;
  let isFile = false;
  let image = false;
  const extensions = new Set<string>();
  const mimeTypes = new Set<string>();
  let maxKilobytes: number | undefined;

  for (const rule of rules) {
    switch (rule.rule) {
      case 'required':
        required = true;
        break;

      case 'nullable':
        nullable = true;
        break;

      case 'string':
        baseType = new PrimitiveType(PrimitiveKind.STRING);
        break;

      case 'integer':
      case 'numeric':
        baseType = new PrimitiveType(PrimitiveKind.NUMBER);
        break;

      case 'boolean':
        baseType = new PrimitiveType(PrimitiveKind.BOOLEAN);
        break;

      case 'array':
        baseType = new ReadonlyCollectionType(
          CollectionKind.ARRAY,
          new PrimitiveType(PrimitiveKind.STRING)
        );
        break;

      case 'date':
      case 'date_format':
        baseType = new PrimitiveType(PrimitiveKind.DATETIME);
        break;

      case 'file':
        isFile = true;
        baseType = new PrimitiveType(PrimitiveKind.FILE);
        break;

      case 'image':
        isFile = true;
        image = true;
        baseType = new PrimitiveType(PrimitiveKind.FILE);
        break;

      case 'mimes':
        isFile = true;
        for (const extension of rule.parameters ?? []) {
          extensions.add(extension.toLowerCase());
        }
        baseType = new PrimitiveType(PrimitiveKind.FILE);
        break;

      case 'mimetypes':
        isFile = true;
        for (const mimeType of rule.parameters ?? []) {
          mimeTypes.add(mimeType.toLowerCase());
        }
        baseType = new PrimitiveType(PrimitiveKind.FILE);
        break;

      case 'json':
        baseType = new PrimitiveType(PrimitiveKind.STRING);
        break;

      case 'max':
        if (rule.parameters?.[0] && Number.isFinite(Number(rule.parameters[0]))) {
          maxKilobytes = Number(rule.parameters[0]);
        }
        break;

      default:
        break;
    }
  }

  const fileConstraints = isFile
    ? {
      ...(image ? { image: true } : {}),
      ...(extensions.size > 0 ? { extensions: Array.from(extensions) } : {}),
      ...(mimeTypes.size > 0 ? { mimeTypes: Array.from(mimeTypes) } : {}),
      ...(maxKilobytes !== undefined ? { maxBytes: maxKilobytes * 1024 } : {})
    }
    : undefined;

  return {
    type: baseType,
    fileConstraints,
    required,
    nullable
  };
}
