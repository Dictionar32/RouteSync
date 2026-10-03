import { toCamelCase } from "../../../../utils/resource-naming";
import {
    RequestField,
    FileValidationConstraints
} from "../../../artifacts/RequestTypesArtifact";
import { SemanticType, PrimitiveType, PrimitiveKind, primitiveType } from "../../../types/SemanticType";
import { SemanticValueFactory, type RequestFieldName, type PropertyName } from "../../../../types/domain/semanticValues";
import { RequestFieldMeaningFactory, type RequestFieldMeaning } from "../../../../types/domain/requestFieldMeaning";
import { RequestFieldPresenceFactory, type RequestFieldPresence } from "../../../../types/domain/requestFieldPresence";
import type { SourceSpan } from "../../../../types/upstream/provenance";
import { relationEqual } from "../../../../semantic/kernel/semanticRelations";
import { relationGate } from "../../../../semantic/kernel/relationalSequence";

export interface ScannedFormFieldParams {
    readonly name: RequestFieldName;
    readonly sourceName: PropertyName;
    readonly meaning: RequestFieldMeaning;
    readonly presence: RequestFieldPresence;
    readonly validation: readonly import("../../../../types/domain/validationRules").ValidationRuleNode[];
    readonly fileConstraints: FileValidationConstraints;
    readonly source: SourceSpan;
}

export type ScannedFormFieldDescriptor = RequestField & ScannedFormFieldParams;

const createFormFieldDescriptor = (params: ScannedFormFieldParams): ScannedFormFieldDescriptor => Object.freeze({
    name: params.name,
    sourceName: params.sourceName,
    meaning: params.meaning,
    presence: params.presence,
    validation: Object.freeze([...params.validation]),
    fileConstraints: Object.freeze([...params.fileConstraints]),
    source: params.source,
});

const semantic = (
    name: string,
    sourceName: string,
    type: SemanticType,
    presence: RequestFieldPresence,
    validation: readonly import("../../../../types/domain/validationRules").ValidationRuleNode[] = [],
    fileConstraints: FileValidationConstraints = [],
    source?: SourceSpan
): ScannedFormFieldDescriptor => createFormFieldDescriptor({
    name: SemanticValueFactory.requestFieldName(name),
    sourceName: SemanticValueFactory.propertyName(sourceName),
    meaning: RequestFieldMeaningFactory.fromSemanticType(type),
    presence,
    validation,
    fileConstraints,
    source: relationGate(Object.is(typeof source, 'object'), () => source as SourceSpan, () => ({ kind: 'source_span', file: SemanticValueFactory.sourceFilePath('<request-field>'), start: { kind: 'number_value', value: 0 }, end: { kind: 'number_value', value: 0 } })),
});

export const ScannedFormFieldDescriptor = Object.freeze({
    create(params: ScannedFormFieldParams): ScannedFormFieldDescriptor { return createFormFieldDescriptor(params); },
    required(name: string, type: SemanticType, transformedName?: string): ScannedFormFieldDescriptor {
        return semantic(relationGate(Object.is(typeof transformedName, 'string'), () => transformedName as string, () => toCamelCase(name)), name, type, RequestFieldPresenceFactory.required(false));
    },
    optional(name: string, type: SemanticType, transformedName?: string): ScannedFormFieldDescriptor {
        return semantic(relationGate(Object.is(typeof transformedName, 'string'), () => transformedName as string, () => toCamelCase(name)), name, type, RequestFieldPresenceFactory.optional(true));
    },
    fromResolved(name: string, type: SemanticType, presence: RequestFieldPresence, validation: readonly import("../../../../types/domain/validationRules").ValidationRuleNode[] = [], transformedName?: string, source?: SourceSpan): ScannedFormFieldDescriptor {
        return semantic(relationGate(Object.is(typeof transformedName, 'string'), () => transformedName as string, () => toCamelCase(name)), name, type, presence, validation, [], source);
    },
});
