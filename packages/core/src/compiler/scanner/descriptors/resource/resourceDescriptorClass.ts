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
      name: SemanticValueFactory.resourceName(params.name),
      baseName: SemanticValueFactory.resourceName(params.baseName),
      typeName: SemanticValueFactory.responseTypeName(params.typeName)
    });
    this.binding = Object.freeze({
      model: { kind: 'model' as const, modelName: params.modelName }
    });
    this.surface = Object.freeze({
      sanitizedName: SemanticValueFactory.propertyName(toCamelCase(params.name)),
      fields: Object.freeze(params.fields),
      assignments: Object.freeze(params.assignments)
    });
    this.provenance = Object.freeze({
      sourceFile: SemanticValueFactory.sourceFilePath(params.sourceFile),
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
    const baseName = ResourceNamingConvention.stripSuffix(name);
    return new ScannedResourceDescriptor({
      name,
      baseName,
      typeName: ResourceNamingConvention.toTransformedName(baseName),
      modelName,
      fields,
      assignments,
      sourceFile,
      sourceLine,
      isSynthetic
    });
  }
}
