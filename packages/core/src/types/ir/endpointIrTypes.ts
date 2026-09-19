/**
 * endpointIrTypes.ts
 *
 * Endpoint domain IR interfaces, parameters, and metadata contracts.
 * Conforms to Level 7 Subatomic Architecture & Rule 14 (<= 100 lines).
 *
 * @module core/types/ir/endpointIrTypes
 */

import { PrimitiveKind } from '../../compiler/types/SemanticType';
import type { HttpMethod } from '../domain/httpVocabulary';
import type { ResourceFieldIR } from './resourceIrTypes';
import type { ActionName, CodeExpression, ControllerName, EndpointId, HttpHeaderName, ModelName, PropertyName, ResourceName, ResponseTypeName, RouteName, RoutePath, SourceLineNumber, TypeExpression } from './nominalVocabulary';
import type { ValidationRules } from './requestIrTypes';
import { createPropertyName } from './nominalVocabulary';
import type { DescriptionText } from '../upstream/valueObjects';

export interface ParameterIR {
    readonly name: PropertyName;
    readonly type: PrimitiveKind;
    readonly required: boolean;
    readonly description: DescriptionText;
    readonly validation?: ValidationRules;
}

export type RequestReference =
    | { readonly type: 'none' }
    | { readonly type: 'request_ir'; readonly reference: string }
    | { readonly type: 'inline'; readonly reference: string; readonly inlineFields: readonly ResourceFieldIR[] };

export interface HeaderIR {
    readonly name: HttpHeaderName;
    readonly value: CodeExpression;
    readonly required: boolean;
}

import type { PaginationState } from './paginationState';
export type { PaginationDescriptor, PaginationState } from './paginationState';

type NoPagination = Extract<PaginationState, { readonly kind: 'none' }>;
type PresentPagination = Extract<PaginationState, { readonly kind: 'present' }>;

export type ResponseReference =
    | { readonly type: 'resource'; readonly resource: ResourceName; readonly statusCode: number; readonly headers: readonly HeaderIR[]; readonly pagination: NoPagination }
    | { readonly type: 'collection'; readonly resource: ResourceName; readonly statusCode: number; readonly headers: readonly HeaderIR[]; readonly pagination: NoPagination }
    | { readonly type: 'paginated'; readonly resource: ResourceName; readonly statusCode: number; readonly headers: readonly HeaderIR[]; readonly pagination: PresentPagination }
    | { readonly type: 'custom'; readonly responseType: ResponseTypeName; readonly statusCode: number; readonly headers: readonly HeaderIR[]; readonly pagination: PaginationState }
    | { readonly type: 'empty'; readonly statusCode: 204; readonly headers: readonly HeaderIR[]; readonly pagination: NoPagination };

export interface MiddlewareIR {
    readonly name: string;
    readonly parameters: readonly TypeExpression[];
    readonly order: SourceLineNumber;
}

export interface EndpointMetadata {
    readonly controller: ControllerName;
    readonly action: ActionName;
    readonly routeName: RouteName;
    readonly generatedAt: import('../upstream/valueObjects').GenerationTimestamp;
    readonly security: { readonly kind: 'authenticated' | 'public' };
    readonly cache: { readonly kind: 'cached' | 'uncached' };
}

export interface EndpointIR {
    readonly id: EndpointId;
    readonly method: HttpMethod;
    readonly path: RoutePath;
    readonly pathParams: readonly ParameterIR[];
    readonly queryParams: readonly ParameterIR[];
    readonly request: RequestReference;
    readonly response: ResponseReference;
    readonly middleware: readonly MiddlewareIR[];
    readonly metadata: EndpointMetadata;
}
