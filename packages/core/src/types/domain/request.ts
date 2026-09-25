/**
 * Canonical request vocabulary shared by lexer-derived facts, scanner, IR,
 * compiler passes, lowerers and emitters.
 */

import type { SourceFilePath } from './semanticValues';
import type { SourceSpan } from '../upstream/provenance';

import type { ObjectProperty } from "../../compiler/types/SemanticType";
import type { RequestFieldMeaning } from './requestFieldMeaning';
import type { RequestFieldPresence } from './requestFieldPresence';
import type { ValidationRuleNode } from "./validationRules";
import type { ClassName, FormTypeName, PropertyName, RequestFieldName, ResourceName } from "./semanticValues";
import type { ResponseContract } from "./responseContracts";


export type FileValidationConstraintVisitor<T> = {
    readonly image: (value: { readonly kind: 'image' }) => T;
    readonly extensions: (value: { readonly kind: 'extensions'; readonly values: readonly string[] }) => T;
    readonly mimeTypes: (value: { readonly kind: 'mime_types'; readonly values: readonly string[] }) => T;
    readonly maxBytes: (value: { readonly kind: 'max_bytes'; readonly value: number }) => T;
};

export type FileValidationConstraint =
    | { readonly kind: 'image'; readonly accept: <T>(visitor: FileValidationConstraintVisitor<T>) => T }
    | { readonly kind: 'extensions'; readonly values: readonly string[]; readonly accept: <T>(visitor: FileValidationConstraintVisitor<T>) => T }
    | { readonly kind: 'mime_types'; readonly values: readonly string[]; readonly accept: <T>(visitor: FileValidationConstraintVisitor<T>) => T }
    | { readonly kind: 'max_bytes'; readonly value: number; readonly accept: <T>(visitor: FileValidationConstraintVisitor<T>) => T };

export type FileValidationConstraints = readonly FileValidationConstraint[];

export type RequestFieldRequirement =
    | { readonly kind: 'unconditional' }
    | { readonly kind: 'required_with'; readonly fields: readonly PropertyName[] }
    | { readonly kind: 'required_with_all'; readonly fields: readonly PropertyName[] }
    | { readonly kind: 'required_without'; readonly fields: readonly PropertyName[] }
    | { readonly kind: 'required_without_all'; readonly fields: readonly PropertyName[] }
    | { readonly kind: 'required_if'; readonly field: PropertyName; readonly values: readonly ValidationParameter[] }
    | { readonly kind: 'required_unless'; readonly field: PropertyName; readonly values: readonly ValidationParameter[] };

export interface RequestField {
    readonly sourceName: PropertyName;
    readonly name: RequestFieldName;
    readonly meaning: RequestFieldMeaning;
    readonly fileConstraints: FileValidationConstraints;
    readonly presence: RequestFieldPresence;
    readonly requirement: RequestFieldRequirement;
    readonly validation: readonly ValidationRuleNode[];
    readonly source: SourceSpan;
}

export const FormActionName = Object.freeze({
    Create: "create",
    Update: "update"
} as const);

export type FormActionName =
    typeof FormActionName[keyof typeof FormActionName];

export interface FormAction {
    readonly name: FormActionName;
    readonly fields: readonly RequestField[];
}

export interface ResponseData {
    /** Authoritative semantic contract produced at the Laravel response boundary. */
    readonly contract: ResponseContract;
    /** Syntax-level fields retained only for legacy mapper lowering. */
    readonly fields: readonly ObjectProperty[];
}

export type RequestResponse =
    | { readonly kind: "none" }
    | { readonly kind: "data"; readonly value: ResponseData };

export interface FormRequestIdentity {
    readonly requestClass: ClassName;
    readonly formType: FormTypeName;
}

export interface FormRequestSource {
    readonly identity: FormRequestIdentity;
    readonly sourceFile: SourceFilePath;
    readonly source: SourceSpan;
    readonly authorization: RequestAuthorizationSource;
    readonly fields: readonly RequestField[];
}

export type RequestAuthorizationSource =
    | { readonly kind: 'authorized' }
    | { readonly kind: 'denied' };

export interface RequestIdentity {
    readonly source: FormRequestIdentity;
    readonly resource: ResourceName;
}

/**
 * High-level semantic relation between a route and its actual FormRequest.
 * `source` is the scanned origin; `identity` is the resolved route binding.
 * The no_request branch makes absence explicit instead of encoding it as null.
 */
export type RouteRequestBinding =
    | {
        readonly kind: 'form_request';
        readonly identity: RequestIdentity;
        readonly source: FormRequestSource;
    }
    | {
        readonly kind: 'framework_request';
        readonly type: ClassName;
    }
    | {
        readonly kind: 'no_request';
    };

/**
 * Complete semantic request contract.
 * Identity is the single source for request/resource/form names;
 * consumers must not carry duplicate scalar projections.
 */
export interface RequestType {
    readonly identity: RequestIdentity;
    readonly source: FormRequestSource;
    readonly actions: readonly FormAction[];
    readonly response: RequestResponse;
}
