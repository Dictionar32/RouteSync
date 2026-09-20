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
import type { Lookup } from '../types/upstream/collections';

export type ModelColumn = ParsedColumn;
export type ModelColumnContract = ParsedColumn;
export type ModelRelation = ParsedRelation;
export type ModelRelationContract = ParsedRelation;
export type ModelAccessor = ParsedAccessor;
export type ModelAccessorContract = ParsedAccessor;

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
export class ModelAssignmentIndex {
    private readonly lookup: ReadonlyMap<VariableName, ModelAssignmentBinding>;

    constructor(assignments: readonly ModelAssignmentBinding[]) {
        const lookup = new Map<VariableName, ModelAssignmentBinding>();
        for (const assignment of assignments) lookup.set(assignment.name, assignment);
        this.lookup = lookup;
        Object.freeze(this);
    }

    public lookupBinding(name: VariableName): Lookup<ModelAssignmentBinding> {
        const value = this.lookup.get(name);
        return value === undefined ? { kind: 'missing' } : { kind: 'found', value };
    }

    public get size(): number {
        return this.lookup.size;
    }
}

export interface ModelResolutionState {
    readonly assignments: readonly ModelAssignmentBinding[];
    readonly assignmentIndex: ModelAssignmentIndex;
}

export const EMPTY_MODEL_RESOLUTION_STATE: ModelResolutionState = Object.freeze({
    assignments: Object.freeze([]),
    assignmentIndex: new ModelAssignmentIndex([]),
});

export interface ModelNode extends ParsedModel, ModelResolutionState {}
export type ModelNodeContract = ModelNode

/** Origin input is intentionally the same verified high-level model plus state. */
export interface ModelNodeInput {
    readonly model: ParsedModel;
    readonly assignments: readonly ModelAssignmentBinding[];
}

export function verifyModelNode(input: ModelNodeInput): ModelNode {
    const assignments = Object.freeze([...input.assignments]);
    return Object.freeze({
        ...input.model,
        assignments,
        assignmentIndex: new ModelAssignmentIndex(assignments),
    });
}
