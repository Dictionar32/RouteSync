/**
 * endpointIrTypes.ts
 *
 * Endpoint domain IR interfaces, parameters, and metadata contracts.
 * Conforms to Level 7 Subatomic Architecture & Rule 14 (<= 100 lines).
 *
 * @module core/types/ir/endpointIrTypes
 */

import type { PrimitiveKind } from '../../compiler/types/SemanticType';
import type { HttpMethod } from '../domain/httpVocabulary';
import type { ResourceFieldIR } from './resourceIrTypes';
import type { ValidationRules } from './requestIrTypes';

export interface ParameterIR {
    readonly name: string;
    readonly type: PrimitiveKind;
    readonly required: boolean;
    readonly description?: string;
    readonly validation?: ValidationRules;
}

export type RequestReference =
    | { readonly type: 'none' }
    | { readonly type: 'request_ir'; readonly reference: string }
    | { readonly type: 'inline'; readonly reference: string; readonly inlineFields: readonly ResourceFieldIR[] };

export interface HeaderIR {
    readonly name: string;
    readonly value?: string;
    readonly required: boolean;
}

export interface PaginationIR {
    readonly type: 'cursor' | 'offset' | 'simple';
    readonly metaFields: readonly string[];
}

export type ResponseReference =
    | { readonly type: 'resource'; readonly resource: string; readonly statusCode: number; readonly headers: readonly HeaderIR[]; readonly pagination: PaginationIR | null }
    | { readonly type: 'collection'; readonly resource: string; readonly statusCode: number; readonly headers: readonly HeaderIR[]; readonly pagination: PaginationIR | null }
    | { readonly type: 'paginated'; readonly resource: string; readonly statusCode: number; readonly headers: readonly HeaderIR[]; readonly pagination: PaginationIR }
    | { readonly type: 'custom'; readonly statusCode: number; readonly headers: readonly HeaderIR[]; readonly pagination: PaginationIR | null }
    | { readonly type: 'empty'; readonly statusCode: number; readonly headers: readonly HeaderIR[]; readonly pagination: PaginationIR | null };

export interface MiddlewareIR {
    readonly name: string;
    readonly parameters?: readonly string[];
    readonly order: number;
}

export interface EndpointMetadata {
    readonly controller: string;
    readonly action: string;
    readonly routeName?: string;
    readonly generated_at: string;
    readonly authenticated?: boolean;
    readonly auth?: boolean;
    readonly cached?: boolean;
}

export interface EndpointIR {
    readonly id: string;
    readonly method: HttpMethod;
    readonly path: string;
    readonly pathParams: readonly ParameterIR[];
    readonly queryParams: readonly ParameterIR[];
    readonly request: RequestReference;
    readonly response: ResponseReference;
    readonly middleware: readonly MiddlewareIR[];
    readonly metadata: EndpointMetadata;
}
