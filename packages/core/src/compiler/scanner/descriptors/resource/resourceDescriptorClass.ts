/**
 * resourceDescriptorClass.ts
 *
 * ScannedResourceDescriptor implementation and factory.
 *
 * @module core/compiler/scanner/descriptors/resource
 */

import type {
  ResourceFieldDescriptor,
  ParsedResource,
  ResourceAssignment
} from '../../../../types/route';
import { SemanticValueFactory } from '../../../../types/domain/semanticValues';
import type { ResourceName, ResponseTypeName } from '../../../../types/upstream/names';
import { toCamelCase, ResourceNamingConvention } from '../../../../utils/resource-naming';
import { ScannedResourceParams, CreateResourceDescriptorOptions } from './resourceDescriptorTypes';

export { ScannedResourceParams, CreateResourceDescriptorOptions };

/**
 * Reusable Constructor: Scanned Resource Descriptor.
 */
export class ScannedResourceDescriptor implements ParsedResource {
  public readonly identity: ParsedResource['identity'];
  public readonly binding: ParsedResource['binding'];
  public readonly surface: ParsedResource['surface'];
  public readonly provenance: ParsedResource['provenance'];

  constructor(params: ScannedResourceParams) {
    this.identity = Object.freeze({
      name: params.name,
      baseName: params.baseName,
      typeName: params.typeName
    });
    this.binding = Object.freeze({
      model: { kind: 'model' as const, modelName: params.modelName }
    });
    this.surface = Object.freeze({
      sanitizedName: SemanticValueFactory.propertyName(toCamelCase(params.name.value.value)),
      fields: Object.freeze(params.fields),
      assignments: Object.freeze(params.assignments)
    });
    this.provenance = Object.freeze({
      sourceFile: params.sourceFile,
      sourceLine: SemanticValueFactory.sourceLineNumber(params.sourceLine),
      synthetic: params.isSynthetic
    });
    Object.freeze(this);
  }

  public static create({
    name,
    fields,
    sourceFile,
    sourceLine,
    assignments,
    modelName,
    isSynthetic
  }: CreateResourceDescriptorOptions): ScannedResourceDescriptor {
    const baseNameValue = ResourceNamingConvention.stripSuffix(name.value.value);
    const baseName: ResourceName = SemanticValueFactory.resourceName(baseNameValue);
    const typeName: ResponseTypeName = SemanticValueFactory.responseTypeName(ResourceNamingConvention.toTransformedName(baseNameValue));
    return new ScannedResourceDescriptor({
      name,
      baseName,
      typeName,
      modelName,
      fields,
      assignments,
      sourceFile,
      sourceLine,
      isSynthetic
    });
  }
}
