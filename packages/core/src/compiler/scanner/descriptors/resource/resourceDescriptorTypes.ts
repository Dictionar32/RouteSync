/**
 * resourceDescriptorTypes.ts
 *
 * Type contracts for Scanned Resource Descriptors.
 *
 * @module core/compiler/scanner/descriptors/resource/resourceDescriptorTypes
 */

import type { ResourceFieldDescriptor, ResourceAssignment } from '../../../../types/route';
import type { ModelName } from '../../../../types/domain/semanticValues';
import type { ResourceName, ResponseTypeName, SourceFile } from '../../../../types/upstream/names';

export interface ScannedResourceParams {
  readonly name: ResourceName;
  readonly baseName: ResourceName;
  readonly typeName: ResponseTypeName;
  readonly modelName: ModelName;
  readonly fields: readonly ResourceFieldDescriptor[];
  readonly assignments: readonly ResourceAssignment[];
  readonly sourceFile: SourceFile;
  readonly sourceLine: number;
  readonly isSynthetic: boolean;
}

/**
 * Level 7 Complete Contract for CreateResourceDescriptorOptions (0 undefined, 0 null, 0 ?:).
 */
export interface CreateResourceDescriptorOptionsContract {
  readonly name: ResourceName;
  readonly fields: readonly ResourceFieldDescriptor[];
  readonly sourceFile: SourceFile;
  readonly sourceLine: number;
  readonly assignments: readonly ResourceAssignment[];
  readonly modelName: ModelName;
  readonly isSynthetic: boolean;
}

export interface CreateResourceDescriptorOptions {
  readonly name: ResourceName;
  readonly fields: readonly ResourceFieldDescriptor[];
  readonly sourceFile: SourceFile;
  readonly sourceLine: number;
  readonly assignments: readonly ResourceAssignment[];
  readonly modelName: ModelName;
  readonly isSynthetic: boolean;
}
