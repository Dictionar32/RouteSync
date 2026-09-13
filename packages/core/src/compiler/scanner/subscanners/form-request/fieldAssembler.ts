/**
 * fieldAssembler.ts
 *
 * Assembles RequestField descriptors from partitioned validation rules.
 *
 * @module core/compiler/scanner/subscanners/form-request
 */

import type { RequestField } from '../../../artifacts/RequestTypesArtifact';
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
      const childObjectType = new ObjectType({ name: key, baseName: key, properties: childProperties });
      const arrayType = interner.intern(new ReadonlyCollectionType(CollectionKind.ARRAY, childObjectType));

      fields.push(ScannedFormFieldDescriptor.create({
        name: key,
        originalName: key,
        type: arrayType,
        required: isRequired,
        nullable: isNullable,
        validationAst
      }));
    } else if (partitioned.primitiveArrayProps.has(key)) {
      fields.push(ScannedFormFieldDescriptor.create({
        name: key,
        originalName: key,
        type: partitioned.primitiveArrayProps.get(key)!,
        required: isRequired,
        nullable: isNullable,
        validationAst
      }));
    } else {
      const isArrayRule = ruleStr.includes('array');
      const isNum = ruleStr.includes('numeric') || ruleStr.includes('integer') || ruleStr.includes('decimal');
      const isBool = ruleStr.includes('boolean');
      let semanticType: SemanticType;

      if (isArrayRule) {
        const unknownType = interner.intern(new PrimitiveType(PrimitiveKind.UNKNOWN));
        semanticType = interner.intern(new ReadonlyCollectionType(CollectionKind.ARRAY, unknownType));
      } else {
        let primKind = PrimitiveKind.STRING;
        if (isNum) primKind = PrimitiveKind.NUMBER;
        else if (isBool) primKind = PrimitiveKind.BOOLEAN;
        semanticType = interner.intern(new PrimitiveType(primKind));
      }

      fields.push(ScannedFormFieldDescriptor.create({
        name: key,
        originalName: key,
        type: semanticType,
        required: isRequired,
        nullable: isNullable,
        validationAst
      }));
    }
  }

  for (const [parentKey, childProperties] of partitioned.arrayProps.entries()) {
    if (!processedKeys.has(parentKey)) {
      const childObjectType = new ObjectType({ name: toCamelCase(parentKey), baseName: toCamelCase(parentKey), properties: childProperties });
      const arrayType = interner.intern(new ReadonlyCollectionType(CollectionKind.ARRAY, childObjectType));
      fields.push(ScannedFormFieldDescriptor.create({
        name: parentKey,
        originalName: parentKey,
        type: arrayType,
        required: false,
        nullable: false
      }));
    }
  }

  return fields;
}
