/**
 * scannedRouteDescriptor.ts
 *
 * First-Class Level 7 Domain Descriptor for Scanned Routes.
 * Implements ScannedRouteContract with 100% direct assignment and zero null sentinels.
 *
 * @module cli/utils/incremental/descriptors
 */

import { SourceRef, SourceRefFactory } from '@routesync/core';
import {
  NominalAtomFactory,
  type ScannedRouteMethod,
  type ScannedRoutePath,
  type ScannedRouteName,
  type ScannedStableHash
} from '../types/nominalAtoms';
import type { RouteResponsePayloadContract } from '../types/responsePayloadTypes';
import type { ScannedRouteContract, ScannedRouteOptions } from '../types/scannedRouteTypes';

export class ScannedRouteDescriptor implements ScannedRouteContract {
  public readonly method: ScannedRouteMethod;
  public readonly path: ScannedRoutePath;
  public readonly auth: boolean;
  public readonly schemaEntries: readonly (readonly [string, unknown])[];
  public readonly responsePayload: RouteResponsePayloadContract;
  public readonly assignmentEntries: readonly (readonly [string, string])[];
  public readonly name: ScannedRouteName;
  public readonly source: SourceRef;

  public stableHash: ScannedStableHash;
  public response: unknown;
  public assignments?: Record<string, string> | null;
  public schema?: Record<string, unknown> | null;

  public constructor(contract: ScannedRouteContract) {
    this.method = contract.method;
    this.path = contract.path;
    this.auth = contract.auth;
    this.schemaEntries = contract.schemaEntries;
    this.responsePayload = contract.responsePayload;
    this.assignmentEntries = contract.assignmentEntries;
    this.stableHash = contract.stableHash;
    this.name = contract.name;
    this.source = contract.source;

    this.response = contract.responsePayload.kind === 'unknown' ? contract.responsePayload.raw : contract.responsePayload;
    this.assignments = contract.assignmentEntries.length > 0 ? Object.fromEntries(contract.assignmentEntries) : null;
    this.schema = contract.schemaEntries.length > 0 ? Object.fromEntries(contract.schemaEntries) : null;
  }

  public get sourceFile(): string | null {
    return this.source.file || null;
  }

  public get sourceLine(): number | null {
    return this.source.line || null;
  }

  public static create(options: ScannedRouteOptions): ScannedRouteDescriptor {
    const method = NominalAtomFactory.method(options.method);
    const path = NominalAtomFactory.path(options.path);
    const auth = Boolean(options.auth);
    const stableHash = NominalAtomFactory.stableHash(options.stableHash || '');
    const name = NominalAtomFactory.name(options.name || '');

    const schemaEntries = Array.isArray(options.schema) ? options.schema : Object.entries(options.schema || {});
    const assignmentEntries = Array.isArray(options.assignments) ? options.assignments : Object.entries(options.assignments || {});

    const source: SourceRef = options.source || SourceRefFactory.create(
      options.sourceFile || '', 'route', options.sourceLine ?? 1, 0
    );

    const responsePayload: RouteResponsePayloadContract = { kind: 'unknown', raw: options.response };

    return new ScannedRouteDescriptor({
      method, path, auth, schemaEntries, responsePayload, assignmentEntries, stableHash, name, source
    });
  }

  public static empty(): ScannedRouteDescriptor {
    return ScannedRouteDescriptor.create({ method: 'GET', path: '/' });
  }

  public static fromRaw(raw: Record<string, unknown>): ScannedRouteDescriptor {
    return ScannedRouteDescriptor.create(raw as unknown as ScannedRouteOptions);
  }
}
