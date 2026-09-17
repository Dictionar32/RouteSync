/** Canonical manifest IR vocabulary. */
import type { ResolvedSemanticType } from './resolvedSemanticTypes';
import type { PaginationState } from './paginationState';
import type { ActionName, ControllerName, ModelName, PropertyName, ResourceName, ResponseTypeName, RouteName, RoutePath, SourceFilePath, SourceLineNumber, TypeExpression } from './nominalVocabulary';

export type ParsedValidationMap = ReadonlyMap<PropertyName, TypeExpression>;

export interface ManifestField {
  readonly name: PropertyName;
  readonly type: TypeExpression;
  readonly semanticType: ResolvedSemanticType;
  readonly format: TypeExpression;
  readonly validationRules: readonly TypeExpression[];
  readonly description: TypeExpression;
}

export interface ManifestAction {
  readonly name: ActionName;
  readonly schema: ParsedValidationMap;
  readonly fields: readonly ManifestField[];
  readonly validation: ParsedValidationMap;
}

export interface ParsedResource {
  readonly name: ResourceName;
  readonly sourceModel: ModelName;
  readonly fields: readonly ManifestField[];
  readonly controller: ControllerName;
  readonly routes: readonly RouteName[];
  readonly isSynthetic: 'synthetic' | 'source';
}

export interface ParsedRequest {
  readonly name: string;
  readonly actions: readonly ManifestAction[];
  readonly controller: ControllerName;
  readonly routes: readonly RouteName[];
}

type NoPagination = Extract<PaginationState, { readonly kind: 'none' }>;
type PresentPagination = Extract<PaginationState, { readonly kind: 'present' }>;

export type RouteResponseBinding =
  | {
      readonly kind: 'resource';
      readonly resource: ResourceName;
      readonly statusCode: 200 | 201 | 202 | 204;
      readonly pagination: NoPagination;
    }
  | {
      readonly kind: 'collection';
      readonly resource: ResourceName;
      readonly statusCode: 200 | 201 | 202;
      readonly pagination: NoPagination;
    }
  | {
      readonly kind: 'paginated';
      readonly resource: ResourceName;
      readonly statusCode: 200 | 201 | 202;
      readonly pagination: PresentPagination;
    }
  | {
      readonly kind: 'custom';
      readonly responseType: ResponseTypeName;
      readonly statusCode: 200 | 201 | 202 | 204;
      readonly pagination: PaginationState;
    }
  | {
      readonly kind: 'empty';
      readonly statusCode: 204;
      readonly pagination: NoPagination;
    };

export interface ParsedRoute {
  readonly id: RouteName;
  readonly method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'OPTIONS' | 'HEAD';
  readonly path: RoutePath;
  readonly action: ActionName;
  readonly controller: ControllerName;
  readonly middleware: readonly string[];
  readonly response: RouteResponseBinding;
}

export interface ManifestMetadata {
  readonly version: string;
  readonly scannedAt: string;
  readonly sourceFiles: readonly SourceFilePath[];
}

export interface RouteManifest {
  readonly routes: readonly ParsedRoute[];
  readonly resources: readonly ParsedResource[];
  readonly requests: readonly ParsedRequest[];
  readonly metadata: ManifestMetadata;
}
