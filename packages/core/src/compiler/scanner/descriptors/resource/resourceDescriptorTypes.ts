/**
 * resourceDescriptorTypes.ts
 *
 * Type contracts for Scanned Resource Descriptors.
 *
 * @module core/compiler/scanner/descriptors/resource/resourceDescriptorTypes
 */

import type { ResourceFieldDescriptor, ResourceAssignment } from '../../../../types/route';
import type { ModelName } from '../../../../types/domain/semanticValues';

export interface ScannedResourceParams {
  readonly name: string;
  readonly baseName: string;
  readonly typeName: string;
  readonly modelName: ModelName;
  readonly fields: readonly ResourceFieldDescriptor[];
  readonly assignments: readonly ResourceAssignment[];
  readonly sourceFile: string;
  readonly sourceLine: number;
  readonly isSynthetic: boolean;
}

/**
 * Level 7 Complete Contract for CreateResourceDescriptorOptions (0 undefined, 0 null, 0 ?:).
 */
export interface CreateResourceDescriptorOptionsContract {
  readonly name: string;
  readonly fields: readonly ResourceFieldDescriptor[];
  readonly sourceFile: string;
  readonly sourceLine: number;
  readonly assignments: readonly ResourceAssignment[];
  readonly modelName: ModelName;
  readonly isSynthetic: boolean;
}

export interface CreateResourceDescriptorOptions {
  readonly name: string;
  readonly fields: readonly ResourceFieldDescriptor[];
  readonly sourceFile: string;
  readonly sourceLine: number;
  readonly assignments: readonly ResourceAssignment[];
  readonly modelName: ModelName;
  readonly isSynthetic: boolean;
}
