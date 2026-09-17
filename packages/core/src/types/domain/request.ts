/**
 * Canonical request vocabulary shared by lexer-derived facts, scanner, IR,
 * compiler passes, lowerers and emitters.
 */

import type { SemanticType, ObjectProperty } from "../../compiler/types/SemanticType";
import type { ValidationRuleNode } from "./validationRules";
import type { FormTypeName, PropertyName, RequestFieldName, ResourceName } from "./semanticValues";
import type { ResponseContract } from "./responseContracts";

export type FileConstraintPresence =
    | { readonly kind: 'none' }
    | { readonly kind: 'present'; readonly value: FileValidationConstraints };

export interface FileValidationConstraints {
    readonly image?: boolean;
    readonly extensions?: readonly string[];
    readonly mimeTypes?: readonly string[];
    readonly maxBytes?: number;
}

export interface RequestField {
    readonly sourceName: string;
    readonly name: string;
    readonly type: SemanticType;
    readonly fileConstraints: FileConstraintPresence;
    readonly required: boolean;
    readonly nullable: boolean;
    readonly validationAst: readonly ValidationRuleNode[];
}

export const FormActionName = Object.freeze({
    Create: "create",
    Update: "update"
} as const);

export type FormActionName =
    typeof FormActionName[keyof typeof FormActionName] | string;

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

export interface RequestType {
    readonly resourceName: string;
    readonly formTypeName: string;
    readonly actions: readonly FormAction[];
    readonly response: RequestResponse;
}
