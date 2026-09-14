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
  ActionDefinition,
  ResourceAssignment
} from '../../../../types/route';
import { toCamelCase, ResourceNamingConvention } from '../../../../utils/resource-naming';
import { ScannedResourceParams, CreateResourceDescriptorOptions } from './resourceDescriptorTypes';

export { ScannedResourceParams, CreateResourceDescriptorOptions };

/**
 * Reusable Constructor: Scanned Resource Descriptor.
 */
export class ScannedResourceDescriptor implements ParsedResource {
  public readonly name: string;
  public readonly baseName: string;
  public readonly typeName: string;
  public readonly sanitizedName: string;
  public readonly baseModel: string | null;
  public readonly modelName: string | null;
  public readonly actions: readonly ActionDefinition[];
  public readonly endpoints: readonly string[];
  public readonly fields: readonly ResourceFieldDescriptor[];
  public readonly assignments: readonly ResourceAssignment[];
  public readonly sourceFile: string;
  public readonly sourceLine: number;
  public readonly isSynthetic: boolean;

  constructor(params: ScannedResourceParams) {
    this.name = params.name;
    this.baseName = params.baseName;
    this.typeName = params.typeName;
    this.sanitizedName = toCamelCase(params.name);
    this.baseModel = params.baseModel;
    this.modelName = params.modelName !== undefined ? params.modelName : params.baseModel;
    this.actions = Object.freeze([]);
    this.endpoints = Object.freeze([]);
    this.fields = Object.freeze(params.fields);
    this.assignments = Object.freeze(params.assignments);
    this.sourceFile = params.sourceFile;
    this.sourceLine = params.sourceLine;
    this.isSynthetic = params.isSynthetic;
    Object.freeze(this);
  }

  public static create({
    name,
    fields,
    sourceFile = '',
    sourceLine = 0,
    assignments = [],
    modelName,
    isSynthetic
  }: CreateResourceDescriptorOptions): ScannedResourceDescriptor {
    const baseName = ResourceNamingConvention.stripSuffix(name);
    const resolvedModel = modelName !== undefined ? modelName : baseName;
    const synthetic = isSynthetic !== undefined ? isSynthetic : resolvedModel === null;
    return new ScannedResourceDescriptor({
      name,
      baseName,
      typeName: ResourceNamingConvention.toTransformedName(baseName),
      baseModel: resolvedModel,
      modelName: resolvedModel,
      fields,
      assignments,
      sourceFile,
      sourceLine,
      isSynthetic: synthetic
    });
  }
}
