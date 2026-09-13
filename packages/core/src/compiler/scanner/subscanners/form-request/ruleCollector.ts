/**
 * ruleCollector.ts
 *
 * Collects parsed validation entries and partitions them into arrayProps, primitiveArrayProps, and regularRules.
 *
 * @module core/compiler/scanner/subscanners/form-request
 */

import type { ValidationRuleNode } from '../../../../types/route';
import { ValidationRuleParser } from '../../../../types/route';
import type { ObjectProperty, SemanticType } from '../../../types/SemanticType';
import {
  PrimitiveType,
  PrimitiveKind,
  ReadonlyCollectionType,
  CollectionKind,
  ScannedObjectProperty
} from '../../../types/SemanticType';
import type { TypeInterner } from '../../../types/TypeInterner';
import type { ParsedArrayEntry } from '../lexer/types';

export interface RegularRuleItem {
  readonly key: string;
  readonly ruleStr: string;
  readonly validationAst: readonly ValidationRuleNode[];
  readonly isRequired: boolean;
  readonly isNullable: boolean;
}

export interface PartitionedRules {
  readonly arrayProps: Map<string, ObjectProperty[]>;
  readonly primitiveArrayProps: Map<string, SemanticType>;
  readonly regularRules: RegularRuleItem[];
}

export function partitionValidationRules(
  entries: readonly ParsedArrayEntry[],
  interner: TypeInterner
): PartitionedRules {
  const arrayProps = new Map<string, ObjectProperty[]>();
  const primitiveArrayProps = new Map<string, SemanticType>();
  const regularRules: RegularRuleItem[] = [];

  for (const entry of entries) {
    const ruleStr = entry.value.kind === 'literal' && entry.value.literalType === 'string'
      ? entry.value.value
      : (entry.value.kind === 'nested_array'
        ? entry.value.entries.map(e => e.rawExpression).join('|')
        : entry.rawExpression);

    const rulesList = (ruleStr || '').split('|').map(s => s.trim().replace(/^['"]|['"]$/g, '')).filter(Boolean);
    const validationAst = ValidationRuleParser.parseAll(rulesList);

    const isNum = ruleStr.includes('numeric') || ruleStr.includes('integer') || ruleStr.includes('decimal');
    const isBool = ruleStr.includes('boolean');
    const isRequired = ruleStr.includes('required') || !ruleStr.includes('sometimes');
    const isNullable = ruleStr.includes('nullable');

    if (entry.key.includes('.*.')) {
      const [parentKey, childKey] = entry.key.split('.*.');
      if (!arrayProps.has(parentKey)) {
        arrayProps.set(parentKey, []);
      }
      let primKind = PrimitiveKind.STRING;
      if (isNum) primKind = PrimitiveKind.NUMBER;
      else if (isBool) primKind = PrimitiveKind.BOOLEAN;

      const semanticType = interner.intern(new PrimitiveType(primKind));
      arrayProps.get(parentKey)!.push(ScannedObjectProperty.create({
        name: childKey,
        type: semanticType,
        required: isRequired,
        nullable: isNullable
      }));
    } else if (entry.key.endsWith('.*')) {
      const baseKey = entry.key.slice(0, -2);
      let primKind = PrimitiveKind.STRING;
      if (isNum) primKind = PrimitiveKind.NUMBER;
      else if (isBool) primKind = PrimitiveKind.BOOLEAN;

      const semanticType = interner.intern(new PrimitiveType(primKind));
      const arrayType = interner.intern(new ReadonlyCollectionType(CollectionKind.ARRAY, semanticType));
      primitiveArrayProps.set(baseKey, arrayType);
    } else {
      regularRules.push({ key: entry.key, ruleStr, validationAst, isRequired, isNullable });
    }
  }

  return { arrayProps, primitiveArrayProps, regularRules };
}
