/**
 * scannedResourceDescriptor.ts
 *
 * First-Class Level 7 Domain Descriptor for Scanned Resources.
 * Implements ScannedResourceContract with complete contracts.
 *
 * @module cli/utils/incremental/descriptors
 */

import { SourceRef, SourceRefFactory } from '@routesync/core';
import type {
  ScannedResourceContract,
  ScannedResourceOptions
} from '../types/scannedResourceTypes';

export class ScannedResourceDescriptor implements ScannedResourceContract {
  public readonly name: string;
  public readonly model: string;
  public readonly assignmentEntries: readonly (readonly [string, string])[];
  public readonly fieldEntries: readonly (readonly [string, unknown])[];
  public readonly source: SourceRef;

  public fields?: Record<string, unknown>;
  public assignments?: Record<string, string>;

  public constructor(contract: ScannedResourceContract) {
    this.name = contract.name;
    this.model = contract.model;
    this.assignmentEntries = contract.assignmentEntries;
    this.fieldEntries = contract.fieldEntries;
    this.source = contract.source;

    this.fields = contract.fieldEntries.length > 0 ? Object.fromEntries(contract.fieldEntries) : {};
    this.assignments = contract.assignmentEntries.length > 0 ? Object.fromEntries(contract.assignmentEntries) : undefined;
  }

  public get sourceFile(): string | null {
    return this.source.file || null;
  }

  public get sourceLine(): number | null {
    return this.source.line || null;
  }

  public static create(options: ScannedResourceOptions): ScannedResourceDescriptor {
    const name = (options.name || '').trim();
    const model = (options.model || '').trim();

    const assignmentEntries = Array.isArray(options.assignments)
      ? options.assignments
      : Object.entries(options.assignments || {});

    const fieldEntries = Array.isArray(options.fields)
      ? options.fields
      : Object.entries(options.fields || {});

    const source: SourceRef = options.source || SourceRefFactory.create(
      options.sourceFile || '', 'resource', options.sourceLine ?? 1, 0
    );

    return new ScannedResourceDescriptor({
      name,
      model,
      assignmentEntries,
      fieldEntries,
      source
    });
  }

  public static empty(): ScannedResourceDescriptor {
    return ScannedResourceDescriptor.create({ name: 'EmptyResource' });
  }

  public static fromRaw(raw: Record<string, unknown>): ScannedResourceDescriptor {
    return ScannedResourceDescriptor.create(raw as unknown as ScannedResourceOptions);
  }
}
