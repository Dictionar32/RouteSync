/**
 * requestDescriptors.ts
 *
 * AST descriptors for Controller Actions, Form Fields, Form Actions, and Request Types.
 *
 * @module core/compiler/scanner/descriptors/requestDescriptors
 */

import {
    ResponseDescriptor,
    ResourceResponseDescriptor,
    RouteValidationRuleEntry,
    ValidationRuleNode
} from "../../../types/route";
import {
    RequestType,
    FormAction,
    RequestField,
    ResponseData,
    FileValidationConstraints
} from "../../artifacts/RequestTypesArtifact";
import { SemanticType } from "../../types/SemanticType";
import { toPascalCase } from "../../../utils/resource-naming";

export interface ControllerActionInfo {
    readonly response: ResponseDescriptor;
    readonly sourceFile: string;
    readonly sourceLine: number;
    readonly formRequestName: string | null;
    readonly schemaRules: readonly RouteValidationRuleEntry[];
}

export interface ScannedControllerActionParams {
    readonly sourceFile: string;
    readonly sourceLine: number;
    readonly response: ResponseDescriptor;
    readonly formRequestName: string | null;
    readonly schemaRules: readonly RouteValidationRuleEntry[];
}

/**
 * Reusable Constructor: Scanned Controller Action Descriptor.
 */
export class ScannedControllerActionDescriptor implements ControllerActionInfo {
    public readonly sourceFile: string;
    public readonly sourceLine: number;
    public readonly response: ResponseDescriptor;
    public readonly formRequestName: string | null;
    public readonly schemaRules: readonly RouteValidationRuleEntry[];

    constructor({ sourceFile, sourceLine, response, formRequestName, schemaRules }: ScannedControllerActionParams) {
        this.sourceFile = sourceFile;
        this.sourceLine = sourceLine;
        this.response = response;
        this.formRequestName = formRequestName;
        this.schemaRules = Object.freeze([...schemaRules]);
        Object.freeze(this);
    }

    public static create({
        sourceFile,
        sourceLine = 0,
        response,
        formRequestName = null,
        schemaRules = []
    }: {
        readonly sourceFile: string;
        readonly sourceLine?: number;
        readonly response?: ResponseDescriptor;
        readonly formRequestName?: string | null;
        readonly schemaRules?: readonly RouteValidationRuleEntry[];
    }): ScannedControllerActionDescriptor {
        const resolvedResponse = response ?? new ResourceResponseDescriptor({ resourceName: "GeneralResource", shape: "single" });
        return new ScannedControllerActionDescriptor({
            sourceFile,
            sourceLine,
            response: resolvedResponse,
            formRequestName: formRequestName ?? null,
            schemaRules: schemaRules ?? []
        });
    }
}

export interface ScannedFormFieldParams {
    readonly name: string;
    readonly originalName: string;
    readonly type: SemanticType;
    readonly required: boolean;
    readonly nullable: boolean;
    readonly validationAst: readonly ValidationRuleNode[];
    readonly fileConstraints: FileValidationConstraints | null;
}

/**
 * Reusable Constructor: Scanned Form Field Descriptor.
 */
export class ScannedFormFieldDescriptor implements RequestField {
    public readonly transformedName: string;
    public readonly originalName: string;
    public readonly type: SemanticType;
    public readonly required: boolean;
    public readonly nullable: boolean;
    public readonly validationAst?: readonly ValidationRuleNode[];
    public readonly fileConstraints?: FileValidationConstraints;

    constructor({ name, originalName, type, required, nullable, validationAst, fileConstraints }: ScannedFormFieldParams) {
        this.transformedName = name;
        this.originalName = originalName;
        this.type = type;
        this.required = required;
        this.nullable = nullable;
        this.validationAst = validationAst.length > 0 ? Object.freeze([...validationAst]) : undefined;
        this.fileConstraints = fileConstraints ?? undefined;
        Object.freeze(this);
    }

    public static create({
        name,
        transformedName,
        originalName = name,
        type,
        required = false,
        nullable = false,
        validationAst = [],
        fileConstraints = null
    }: {
        readonly name: string;
        readonly transformedName?: string;
        readonly originalName?: string;
        readonly type: SemanticType;
        readonly required?: boolean;
        readonly nullable?: boolean;
        readonly validationAst?: readonly ValidationRuleNode[];
        readonly fileConstraints?: FileValidationConstraints | null;
    }): ScannedFormFieldDescriptor {
        return new ScannedFormFieldDescriptor({
            name: transformedName ?? originalName,
            originalName,
            type,
            required,
            nullable,
            validationAst,
            fileConstraints
        });
    }
}

export interface ScannedFormActionParams {
    readonly name: string;
    readonly fields: readonly RequestField[];
}

/**
 * Reusable Constructor: Scanned Form Action Descriptor.
 */
export class ScannedFormActionDescriptor implements FormAction {
    public readonly name: string;
    public readonly fields: readonly RequestField[];

    constructor({ name, fields }: ScannedFormActionParams) {
        this.name = name;
        this.fields = Object.freeze(fields);
        Object.freeze(this);
    }
}

export interface ScannedRequestTypeParams {
    readonly resourceName: string;
    readonly formTypeName: string;
    readonly actions: readonly FormAction[];
    readonly responseData: ResponseData | null;
}

/**
 * Reusable Constructor: Scanned Request Type Descriptor.
 */
export class ScannedRequestTypeDescriptor implements RequestType {
    public readonly resourceName: string;
    public readonly formTypeName: string;
    public readonly actions: readonly FormAction[];
    public readonly responseData?: ResponseData;

    constructor({ resourceName, formTypeName, actions, responseData }: ScannedRequestTypeParams) {
        this.resourceName = resourceName;
        this.formTypeName = formTypeName;
        this.actions = Object.freeze(actions);
        this.responseData = responseData ? Object.freeze(responseData) : undefined;
        Object.freeze(this);
    }

    public static create({
        resourceName,
        formTypeName = `${toPascalCase(resourceName)}Form`,
        actions = [],
        responseData = null
    }: {
        readonly resourceName: string;
        readonly formTypeName?: string;
        readonly actions?: readonly FormAction[];
        readonly responseData?: ResponseData | null;
    }): ScannedRequestTypeDescriptor {
        return new ScannedRequestTypeDescriptor({
            resourceName,
            formTypeName,
            actions,
            responseData
        });
    }
}
