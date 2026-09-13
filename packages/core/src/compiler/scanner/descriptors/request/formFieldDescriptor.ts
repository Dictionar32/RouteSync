/**
 * formFieldDescriptor.ts
 *
 * AST descriptors for Scanned Form Fields.
 *
 * @module core/compiler/scanner/descriptors/request/formFieldDescriptor
 */

import { ValidationRuleNode } from "../../../../types/route";
import {
    RequestField,
    FileValidationConstraints
} from "../../../artifacts/RequestTypesArtifact";
import { SemanticType, PrimitiveType, PrimitiveKind } from "../../../types/SemanticType";

export interface ScannedFormFieldParams {
    readonly name: string;
    readonly originalName: string;
    readonly type: SemanticType;
    readonly required: boolean;
    readonly nullable: boolean;
    readonly validationAst: readonly ValidationRuleNode[] | undefined;
    readonly fileConstraints: FileValidationConstraints | undefined;
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
        this.validationAst = validationAst;
        this.fileConstraints = fileConstraints;
        Object.freeze(this);
    }

    public static create({
        name,
        transformedName,
        originalName = name,
        type,
        required = false,
        nullable = false,
        validationAst,
        fileConstraints
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
        const resolvedValidationAst = validationAst && validationAst.length > 0
            ? Object.freeze([...validationAst])
            : undefined;
        return new ScannedFormFieldDescriptor({
            name: transformedName ?? originalName,
            originalName,
            type,
            required,
            nullable,
            validationAst: resolvedValidationAst,
            fileConstraints: fileConstraints ?? undefined
        });
    }

    public static required(name: string, type: SemanticType, transformedName?: string): ScannedFormFieldDescriptor {
        return new ScannedFormFieldDescriptor({
            name: transformedName ?? name,
            originalName: name,
            type,
            required: true,
            nullable: false,
            validationAst: undefined,
            fileConstraints: undefined
        });
    }

    public static optional(name: string, type: SemanticType, transformedName?: string): ScannedFormFieldDescriptor {
        return new ScannedFormFieldDescriptor({
            name: transformedName ?? name,
            originalName: name,
            type,
            required: false,
            nullable: true,
            validationAst: undefined,
            fileConstraints: undefined
        });
    }

    public static file(name: string, constraints?: FileValidationConstraints, required = true): ScannedFormFieldDescriptor {
        return new ScannedFormFieldDescriptor({
            name,
            originalName: name,
            type: new PrimitiveType(PrimitiveKind.FILE),
            required,
            nullable: !required,
            validationAst: undefined,
            fileConstraints: constraints ? Object.freeze({ ...constraints }) : undefined
        });
    }
}
