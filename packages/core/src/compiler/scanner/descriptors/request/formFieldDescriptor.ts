import { toCamelCase } from "../../../../utils/resource-naming";
import {
    RequestField,
    FileValidationConstraints
} from "../../../artifacts/RequestTypesArtifact";
import { SemanticType, PrimitiveType, PrimitiveKind } from "../../../types/SemanticType";
import { SemanticValueFactory, type RequestFieldName, type PropertyName } from "../../../../types/domain/semanticValues";
import { RequestFieldMeaningFactory, type RequestFieldMeaning } from "../../../../types/domain/requestFieldMeaning";
import { RequestFieldPresenceFactory, type RequestFieldPresence } from "../../../../types/domain/requestFieldPresence";

export interface ScannedFormFieldParams {
    readonly name: RequestFieldName;
    readonly sourceName: PropertyName;
    readonly meaning: RequestFieldMeaning;
    readonly presence: RequestFieldPresence;
    readonly validation: readonly import("../../../../types/domain/validationRules").ValidationRuleNode[];
    readonly fileConstraints: FileValidationConstraints;
}

export class ScannedFormFieldDescriptor implements RequestField {
    public readonly name: RequestFieldName;
    public readonly sourceName: PropertyName;
    public readonly meaning: RequestFieldMeaning;
    public readonly presence: RequestFieldPresence;
    public readonly validation: readonly import("../../../../types/domain/validationRules").ValidationRuleNode[];
    public readonly fileConstraints: FileValidationConstraints;

    constructor(params: ScannedFormFieldParams) {
        this.name = params.name;
        this.sourceName = params.sourceName;
        this.meaning = params.meaning;
        this.presence = params.presence;
        this.validation = Object.freeze([...params.validation]);
        this.fileConstraints = Object.freeze([...params.fileConstraints]);
        Object.freeze(this);
    }

    private static semantic(
        name: string,
        sourceName: string,
        type: SemanticType,
        presence: RequestFieldPresence,
        validation: readonly import("../../../../types/domain/validationRules").ValidationRuleNode[] = [],
        fileConstraints: FileValidationConstraints = []
    ): ScannedFormFieldDescriptor {
        return new ScannedFormFieldDescriptor({
            name: SemanticValueFactory.requestFieldName(name),
            sourceName: SemanticValueFactory.propertyName(sourceName),
            meaning: RequestFieldMeaningFactory.fromSemanticType(type),
            presence,
            validation,
            fileConstraints
        });
    }

    public static create(params: ScannedFormFieldParams): ScannedFormFieldDescriptor {
        return new ScannedFormFieldDescriptor(params);
    }

    public static required(name: string, type: SemanticType, transformedName?: string): ScannedFormFieldDescriptor {
        return ScannedFormFieldDescriptor.semantic(
            transformedName ?? toCamelCase(name),
            name,
            type,
            RequestFieldPresenceFactory.required(false)
        );
    }

    public static optional(name: string, type: SemanticType, transformedName?: string): ScannedFormFieldDescriptor {
        return ScannedFormFieldDescriptor.semantic(
            transformedName ?? toCamelCase(name),
            name,
            type,
            RequestFieldPresenceFactory.optional(true)
        );
    }

    public static fromResolved(
        name: string,
        type: SemanticType,
        presence: RequestFieldPresence,
        validation: readonly import("../../../../types/domain/validationRules").ValidationRuleNode[] = [],
        transformedName?: string
    ): ScannedFormFieldDescriptor {
        return ScannedFormFieldDescriptor.semantic(
            transformedName ?? toCamelCase(name),
            name,
            type,
            presence,
            validation
        );
    }

    public static fromSemantic(
        name: string,
        type: SemanticType,
        required: boolean,
        nullable: boolean,
        validation: readonly import("../../../../types/domain/validationRules").ValidationRuleNode[] = [],
        fileConstraints: FileValidationConstraints = [],
        transformedName?: string
    ): ScannedFormFieldDescriptor {
        const presence = required
            ? RequestFieldPresenceFactory.required(nullable)
            : RequestFieldPresenceFactory.optional(nullable);
        return ScannedFormFieldDescriptor.semantic(
            transformedName ?? toCamelCase(name),
            name,
            type,
            presence,
            validation,
            fileConstraints
        );
    }

    public static file(name: string, constraints: FileValidationConstraints, required = true): ScannedFormFieldDescriptor {
        return ScannedFormFieldDescriptor.semantic(
            name,
            name,
            new PrimitiveType(PrimitiveKind.FILE),
            required ? RequestFieldPresenceFactory.required(false) : RequestFieldPresenceFactory.optional(true),
            [],
            constraints
        );
    }
}
