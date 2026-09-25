/**
 * fieldAssembler.ts
 *
 * Assembles RequestField descriptors from partitioned validation rules.
 *
 * @module core/compiler/scanner/subscanners/form-request
 */

import type { RequestField } from '../../../types/domain/request';
import {
  ObjectType,
  PrimitiveType,
  PrimitiveKind,
  ReadonlyCollectionType,
  CollectionKind,
  type SemanticType
} from '../../../types/SemanticType';
import type { TypeInterner } from '../../../types/TypeInterner';
import { toCamelCase } from '../../../../utils/resource-naming';
import { ScannedFormFieldDescriptor } from '../../descriptors/requestDescriptors';
import type { PartitionedRules } from './ruleCollector';

export function assembleFormFields(
  partitioned: PartitionedRules,
  interner: TypeInterner
): RequestField[] {
  const fields: RequestField[] = [];
  const processedKeys = new Set<string>();

  for (const { key, ruleStr, validationAst, isRequired, isNullable } of partitioned.regularRules) {
    processedKeys.add(key);
    if (partitioned.arrayProps.has(key)) {
      const childProperties = partitioned.arrayProps.get(key)!;
      const childObjectType = new ObjectType({ name: key, baseName: key, properties: childProperties, role: 'plain' });
      const arrayType = interner.intern(new ReadonlyCollectionType(CollectionKind.ARRAY, childObjectType));

      fields.push(ScannedFormFieldDescriptor.fromSemantic(
        key,
        arrayType,
        isRequired,
        isNullable,
        validationAst
      ));
    } else if (partitioned.primitiveArrayProps.has(key)) {
      fields.push(ScannedFormFieldDescriptor.fromSemantic(
        key,
        partitioned.primitiveArrayProps.get(key)!,
        isRequired,
        isNullable,
        validationAst
      ));
    } else {
      const isArrayRule = ruleStr.includes('array');
      const isNum = ruleStr.includes('numeric') || ruleStr.includes('integer') || ruleStr.includes('decimal');
      const isBool = ruleStr.includes('boolean');
      let semanticType: SemanticType;

      if (isArrayRule) {
        const unknownType = interner.intern(new PrimitiveType(PrimitiveKind.UNSPECIFIED));
        semanticType = interner.intern(new ReadonlyCollectionType(CollectionKind.ARRAY, unknownType));
      } else {
        let primKind = PrimitiveKind.STRING;
        if (isNum) primKind = PrimitiveKind.NUMBER;
        else if (isBool) primKind = PrimitiveKind.BOOLEAN;
        semanticType = interner.intern(new PrimitiveType(primKind));
      }

      fields.push(ScannedFormFieldDescriptor.fromSemantic(
        key,
        semanticType,
        isRequired,
        isNullable,
        validationAst
      ));
    }
  }

  for (const [parentKey, childProperties] of partitioned.arrayProps.entries()) {
    if (!processedKeys.has(parentKey)) {
      const childObjectType = new ObjectType({ name: toCamelCase(parentKey), baseName: toCamelCase(parentKey), properties: childProperties, role: 'plain' });
      const arrayType = interner.intern(new ReadonlyCollectionType(CollectionKind.ARRAY, childObjectType));
      fields.push(ScannedFormFieldDescriptor.fromSemantic(
        parentKey,
        arrayType,
        false,
        false
      ));
    }
  }

  return fields;
}
