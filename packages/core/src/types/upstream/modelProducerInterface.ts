import type { ModelCast } from "./model";
import type { ModelAst } from "./ast";
import type { ModelAccessorFact } from "./modelSourceFacts";
import type { EloquentRelationAst } from "./eloquent";
import type { SchemaInterface } from "./schema";
import type { SourceSpan } from "./provenance";
import type { ModelDefinition, ModelSemanticDefinition } from "./model";

/** Complete source evidence accepted by the model producer. */
export interface ModelProducerInput<DeclarationEvidence, PropertyEvidence> {
  readonly sourceSpan: SourceSpan;
  readonly schema: SchemaInterface;
  readonly propertyAsts: readonly PropertyEvidence[];
  readonly declaration: DeclarationEvidence;
  readonly casts: readonly ModelCast[];
  readonly accessors: readonly ModelAccessorFact[];
  readonly eloquentRelations: readonly EloquentRelationAst[];
}

/** Paired model AST and semantic definition for the same source subject. */
export interface ModelProducerResult {
  readonly definition: ModelDefinition;
  readonly ast: ModelAst;
}

/** Upstream-owned operation contract for producing canonical model artifacts. */
export interface ModelProducerInterface<DeclarationEvidence, PropertyEvidence> {
  readonly kind: "laravel_model_producer";
  readonly contractVersion: 1;
  readonly produceResult: (input: ModelProducerInput<DeclarationEvidence, PropertyEvidence>) => ModelProducerResult;
}


/** Upstream-owned semantic model formation operation over typed source evidence. */
export interface ModelSemanticDefinitionFromAstInterface<DeclarationEvidence, PropertyEvidence> {
  readonly kind: "model_semantic_definition_from_ast";
  readonly contractVersion: 1;
  readonly form: (
    sourceSpan: SourceSpan,
    schema: SchemaInterface,
    propertyAsts: readonly PropertyEvidence[],
    declaration: DeclarationEvidence,
    casts: readonly ModelCast[],
    accessors: readonly ModelAccessorFact[],
    relations: readonly EloquentRelationAst[],
  ) => ModelSemanticDefinition;
}

/** Upstream-owned projection operation from closed model semantics to its AST artifact. */
export interface ModelAstFromSemanticInterface {
  readonly kind: "model_ast_from_semantic";
  readonly contractVersion: 1;
  readonly project: (
    model: ModelSemanticDefinition,
    casts: readonly ModelCast[],
    accessors: readonly ModelAccessorFact[],
    sourceSpan: SourceSpan,
  ) => ModelAst;
}
