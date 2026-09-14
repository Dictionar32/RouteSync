/**
 * responseDescriptorContract.ts
 *
 * Level 7 Subatomic Discriminated ADT Contracts for HTTP Response transport.
 * Zero sentinel undefined, zero null, zero optional fields (0% porosity).
 *
 * @module compiler/ir/response
 */

import type { TransportKind } from './responseTransportVocabulary';

export interface TransportBaseContract {
  readonly status: number;
  readonly contentType: string;
  readonly nullable: boolean;
}

export interface JsonTransportContract extends TransportBaseContract {
  readonly transport: 'json';
  readonly schemaFields: readonly string[];
}

export interface ResourceTransportContract extends TransportBaseContract {
  readonly transport: 'resource';
  readonly resourceName: string;
}

export interface ModelTransportContract extends TransportBaseContract {
  readonly transport: 'model';
  readonly modelName: string;
}

export interface PrimitiveTransportContract extends TransportBaseContract {
  readonly transport: 'primitive';
  readonly typeName: string;
}

export interface BinaryTransportContract extends TransportBaseContract {
  readonly transport: 'binary';
  readonly dispositionType: 'inline' | 'attachment';
  readonly filename: string;
}

export interface StreamTransportContract extends TransportBaseContract {
  readonly transport: 'stream';
  readonly chunked: boolean;
  readonly callback: string;
}

export interface RedirectTransportContract extends TransportBaseContract {
  readonly transport: 'redirect';
  readonly redirectType: 'route' | 'url' | 'back' | 'action';
  readonly target: string;
  readonly parameters: readonly string[];
}

export interface EmptyTransportContract extends TransportBaseContract {
  readonly transport: 'empty';
}

export type ResponseDescriptorContract =
  | JsonTransportContract
  | ResourceTransportContract
  | ModelTransportContract
  | PrimitiveTransportContract
  | BinaryTransportContract
  | StreamTransportContract
  | RedirectTransportContract
  | EmptyTransportContract;

export type ResponseContentDisposition = {
  readonly type: 'inline' | 'attachment';
  readonly filename?: string;
};

export type ResponseRedirect = {
  readonly type: 'route' | 'url' | 'back' | 'action';
  readonly target?: string;
  readonly parameters?: Record<string, unknown>;
};

export type ResponseStream = {
  readonly chunked: boolean;
  readonly callback?: string;
};

export type ResponseDescriptor = {
  readonly transport: TransportKind;
  readonly status?: number;
  readonly contentType?: string;
  readonly nullable?: boolean;
  readonly contentDisposition?: ResponseContentDisposition;
  readonly redirect?: ResponseRedirect;
  readonly stream?: ResponseStream;
};
