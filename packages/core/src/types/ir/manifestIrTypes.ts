/** Canonical manifest IR vocabulary. */
import type { SemanticType } from '../../compiler/types/SemanticType';
import type { DescriptionText } from '../upstream/valueObjects';
import type { Presence } from '../upstream/primitiveVocabulary';
import type { ValidationRules } from '../upstream/collections';
import type { PaginationState } from './paginationState';
import type { SourceFile } from '../upstream/names';
import type { ActionName, ControllerName, ModelName, PropertyName, ResourceName, ResponseTypeName, RouteName, RoutePath, SourceFilePath, SourceLineNumber, TypeExpression } from './nominalVocabulary';

export type ParsedValidationMap = ReadonlyMap<PropertyName, TypeExpression>;

export interface ManifestField {
  readonly name: PropertyName;
  readonly type: TypeExpression;
  readonly semanticType: SemanticType;
  readonly presence: Presence;
  readonly validation: ValidationRules;
  readonly description: DescriptionText;
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
  readonly sourceFile: SourceFile;
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

export type { ParsedRoute } from '../domain/routes';

export interface ManifestMetadata {
  readonly version: string;
  readonly scannedAt: string;
  readonly sourceFiles: readonly SourceFilePath[];
}

export type { RouteManifest } from '../domain/base';
