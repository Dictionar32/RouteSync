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

export interface CreateResourceDescriptorOptions {
  readonly name: string;
  readonly fields: readonly ResourceFieldDescriptor[];
  readonly sourceFile?: string;
  readonly sourceLine?: number;
  readonly assignments?: readonly ResourceAssignment[];
  readonly modelName?: string | null;
  readonly isSynthetic?: boolean;
}
