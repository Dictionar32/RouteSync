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

export interface ScannedResourceParams {
  readonly name: string;
  readonly baseName: string;
  readonly typeName: string;
  readonly baseModel: string | null;
  readonly fields: readonly ResourceFieldDescriptor[];
  readonly assignments: readonly ResourceAssignment[];
  readonly sourceFile: string;
  readonly sourceLine: number;
  readonly isSynthetic: boolean;
}

/**
 * Reusable Constructor: Scanned Resource Descriptor.
 */
export class ScannedResourceDescriptor implements ParsedResource {
  public readonly name: string;
  public readonly baseName: string;
  public readonly typeName: string;
  public readonly sanitizedName: string;
  public readonly baseModel: string | null;
  public readonly actions: readonly ActionDefinition[];
  public readonly endpoints: readonly string[];
  public readonly fields: readonly ResourceFieldDescriptor[];
  public readonly assignments: readonly ResourceAssignment[];
  public readonly sourceFile: string;
  public readonly sourceLine: number;
  public readonly isSynthetic: boolean;

  constructor({
    name,
    baseName,
    typeName,
    baseModel,
    fields,
    assignments,
    sourceFile,
    sourceLine,
    isSynthetic
  }: ScannedResourceParams) {
    this.name = name;
    this.baseName = baseName;
    this.typeName = typeName;
    this.sanitizedName = toCamelCase(name);
    this.baseModel = baseModel;
    this.actions = Object.freeze([]);
    this.endpoints = Object.freeze([]);
    this.fields = Object.freeze(fields);
    this.assignments = Object.freeze(assignments);
    this.sourceFile = sourceFile;
    this.sourceLine = sourceLine;
    this.isSynthetic = isSynthetic;
    Object.freeze(this);
  }

  public static create({
    name,
    fields,
    sourceFile = '',
    sourceLine = 0,
    assignments = []
  }: {
    readonly name: string;
    readonly fields: readonly ResourceFieldDescriptor[];
    readonly sourceFile?: string;
    readonly sourceLine?: number;
    readonly assignments?: readonly ResourceAssignment[];
  }): ScannedResourceDescriptor {
    const baseName = ResourceNamingConvention.stripSuffix(name);
    return new ScannedResourceDescriptor({
      name,
      baseName,
      typeName: ResourceNamingConvention.toTransformedName(baseName),
      baseModel: baseName,
      fields,
      assignments,
      sourceFile,
      sourceLine,
      isSynthetic: false
    });
  }
}
