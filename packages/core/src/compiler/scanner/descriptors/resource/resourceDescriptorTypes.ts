/**
 * resourceDescriptorTypes.ts
 *
 * Type contracts for Scanned Resource Descriptors.
 *
 * @module core/compiler/scanner/descriptors/resource/resourceDescriptorTypes
 */

import type { ResourceFieldDescriptor, ResourceAssignment } from '../../../../types/route';

export interface ScannedResourceParams {
  readonly name: string;
  readonly baseName: string;
  readonly typeName: string;
  readonly baseModel: string | null;
  readonly modelName: string | null;
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
  readonly modelName: string;
  readonly isSynthetic: boolean;
}

export type CreateResourceDescriptorOptions = {
  readonly name: string;
  readonly fields: readonly ResourceFieldDescriptor[];
  readonly sourceFile?: string;
  readonly sourceLine?: number;
  readonly assignments?: readonly ResourceAssignment[];
  readonly modelName?: string | null;
  readonly isSynthetic?: boolean;
};
