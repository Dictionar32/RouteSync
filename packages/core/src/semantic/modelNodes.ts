/**
 * High-model semantic boundary.
 *
 * Laravel scanner facts enter here as the already-typed ParsedModel ADT.
 * No Record-shaped member bags are allowed in the semantic model.
 */
import type { ParsedModel } from '../types/domain/models';
import type { ParsedColumn } from '../types/domain/databaseColumns';
import type { ParsedCast, ParsedAccessor, ParsedRelation } from '../types/domain/eloquentTypes';
import type { SemanticResolution } from '../types/domain/semanticResolution';
import type { FieldNode } from '../types/field';
import type { VariableName } from '../types/domain/semanticValues';

export type ModelColumn = ParsedColumn;
export type ModelColumnContract = ParsedColumn;
export type ModelRelation = ParsedRelation;
export type ModelRelationContract = ParsedRelation;
export type ModelAccessor = ParsedAccessor;
export type ModelAccessorContract = ParsedAccessor;

export interface ModelAssignmentBinding {
    readonly name: VariableName;
    readonly ast: FieldNode;
    readonly resolution: SemanticResolution;
}

export interface ModelResolutionState {
    readonly assignments: readonly ModelAssignmentBinding[];
}

export interface ModelNode extends ParsedModel, ModelResolutionState {}
export type ModelNodeContract = ModelNode

/** Origin input is intentionally the same verified high-level model plus state. */
export interface ModelNodeInput {
    readonly model: ParsedModel;
    readonly assignments: readonly ModelAssignmentBinding[];
}

export function verifyModelNode(input: ModelNodeInput): ModelNode {
    return Object.freeze({
        ...input.model,
        assignments: Object.freeze([...input.assignments]),
    });
}
