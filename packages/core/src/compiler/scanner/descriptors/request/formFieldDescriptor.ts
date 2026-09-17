import { ValidationRuleNode } from "../../../../types/route";
import { toCamelCase } from "../../../../utils/resource-naming";
import {
    RequestField,
    FileValidationConstraints
} from "../../../artifacts/RequestTypesArtifact";
import { SemanticType, PrimitiveType, PrimitiveKind, NullableType } from "../../../types/SemanticType";
export interface ScannedFormFieldParams {
    readonly name: string;
    readonly originalName: string;
    readonly type: SemanticType;
    readonly required: boolean;
    readonly nullable: boolean;
    readonly validationAst: readonly ValidationRuleNode[];
    readonly fileConstraints: FileValidationConstraints | null;
}
export class ScannedFormFieldDescriptor implements RequestField {
    public readonly name: string;
    public readonly sourceName: string;
    public readonly type: SemanticType;
    public readonly required: boolean;
    public readonly nullable: boolean;
    public readonly validationAst: readonly ValidationRuleNode[];
    public readonly fileConstraints: FileValidationConstraints | null;
    constructor({ name, originalName, type, required, nullable, validationAst, fileConstraints }: ScannedFormFieldParams) {
        this.name = name;
        this.sourceName = originalName;
        this.required = required;
        this.nullable = nullable;
        this.type = nullable && type.kind !== 'nullable' ? new NullableType(type) : type;
        this.validationAst = Object.freeze([...validationAst]);
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
            name: transformedName === undefined ? toCamelCase(originalName) : transformedName,
            originalName,
            type,
            required,
            nullable,
            validationAst: resolvedValidationAst ?? [],
            fileConstraints: fileConstraints === undefined ? null : fileConstraints
        });
    }
    public static required(name: string, type: SemanticType, transformedName?: string): ScannedFormFieldDescriptor {
        return new ScannedFormFieldDescriptor({
            name: transformedName ?? name,
            originalName: name,
            type,
            required: true,
            nullable: false,
            validationAst: [],
            fileConstraints: null
        });
    }
    public static optional(name: string, type: SemanticType, transformedName?: string): ScannedFormFieldDescriptor {
        return new ScannedFormFieldDescriptor({
            name: transformedName ?? name,
            originalName: name,
            type,
            required: false,
            nullable: true,
            validationAst: [],
            fileConstraints: null
        });
    }
    public static file(name: string, constraints?: FileValidationConstraints, required = true): ScannedFormFieldDescriptor {
        return new ScannedFormFieldDescriptor({
            name,
            originalName: name,
            type: new PrimitiveType(PrimitiveKind.FILE),
            required,
            nullable: !required,
            validationAst: [],
            fileConstraints: constraints === undefined ? null : Object.freeze({ ...constraints })
        });
    }
}
