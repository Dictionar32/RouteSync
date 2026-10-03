/**
 * High-model semantic boundary.
 *
 * Laravel source enters the semantic kernel as the canonical ModelAst.
 * No ParsedModel intermediate is allowed at this boundary.
 */
import type { ModelAst } from '../types/upstream/ast';
import type { ParsedColumn } from '../types/domain/databaseColumns';
import type { ModelCastDescriptor, ModelAccessorDescriptor, ModelRelationDescriptor } from '../types/domain/eloquentTypes';
import type { SemanticResolution } from '../types/domain/semanticResolution';
import type { FieldNode } from '../types/field';
import type { VariableName } from '../types/domain/semanticValues';
import type { Lookup } from '../types/upstream/collections';
import { relationFirst, relationOptionFold } from './kernel/relationalSequence';
import { relationEqual } from './kernel/semanticRelations';

export type ModelColumn = ParsedColumn;
export type ModelColumnContract = ParsedColumn;
export type ModelRelation = ModelRelationDescriptor;
export type ModelRelationContract = ModelRelationDescriptor;
export type ModelAccessor = ModelAccessorDescriptor;
export type ModelAccessorContract = ModelAccessorDescriptor;

/** Complete semantic value produced for a local assignment at the model boundary. */
export interface ModelAssignmentValue {
    readonly syntax: FieldNode;
    readonly semantic: SemanticResolution;
}

/** First-class assignment contract. Variable name and resolved value travel together. */
export interface ModelAssignmentBinding {
    readonly name: VariableName;
    readonly value: ModelAssignmentValue;
}

/** Typed assignment lookup. Consumers do not inspect string-keyed bags. */
export interface ModelAssignmentIndex {
    readonly lookupBinding: (name: VariableName) => Lookup<ModelAssignmentBinding>;
    readonly size: number;
}

export const createModelAssignmentIndex = (assignments: readonly ModelAssignmentBinding[]): ModelAssignmentIndex => {
    const bindings = Object.freeze([...assignments]);
    return Object.freeze({
        lookupBinding: (name: VariableName): Lookup<ModelAssignmentBinding> => relationOptionFold(
            relationFirst(bindings, binding => relationEqual(binding.name, name)),
            () => ({ kind: 'missing' }),
            binding => ({ kind: 'found', value: binding }),
        ),
        get size(): number { return bindings.length; },
    });
};

export interface ModelResolutionState {
    readonly assignments: readonly ModelAssignmentBinding[];
    readonly assignmentIndex: ModelAssignmentIndex;
}

export const EMPTY_MODEL_RESOLUTION_STATE: ModelResolutionState = Object.freeze({
    assignments: Object.freeze([]),
    assignmentIndex: createModelAssignmentIndex([]),
});

export interface ModelNode extends ModelAst, ModelResolutionState {}
export type ModelNodeContract = ModelNode

/** Origin input is intentionally the same verified high-level model plus state. */
export interface ModelNodeInput {
    readonly model: ModelAst;
    readonly assignments: readonly ModelAssignmentBinding[];
}

export function verifyModelNode(input: ModelNodeInput): ModelNode {
    const assignments = Object.freeze([...input.assignments]);
    return Object.freeze({
        ...input.model,
        assignments,
        assignmentIndex: createModelAssignmentIndex(assignments),
    });
}
