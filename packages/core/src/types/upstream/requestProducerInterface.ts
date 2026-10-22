import type { RequestAst } from './ast';
import type { RequestDefinition } from './request';
import type { RequestName, FormTypeName, SourceFile } from './names';
import type { SourceSpan } from './provenance';
import type { TypeInternerInterface } from './typeInternerInterface';

/**
 * Compiler evidence is a type parameter, not an upstream dependency.
 * The upstream contract owns the operation shape while the PHP frontend owns
 * the concrete parser evidence supplied at the composition boundary.
 */
export interface RequestProducerInput<RulesEvidence, MethodEvidence, PropertyEvidence> {
    readonly requestName: RequestName;
    readonly formType: FormTypeName;
    readonly source: SourceSpan;
    readonly rules: RulesEvidence;
    readonly authorize: MethodEvidence;
    readonly methods: readonly MethodEvidence[];
    readonly properties: readonly PropertyEvidence[];
    readonly sourceFile: SourceFile;
    readonly interner: TypeInternerInterface;
}

export interface RequestProducerResult {
    readonly definition: RequestDefinition;
    readonly ast: RequestAst;
}

/** Upstream-owned operation contract parameterized by frontend evidence. */
export interface RequestProducerInterface<RulesEvidence, MethodEvidence, PropertyEvidence> {
    readonly produce: (input: RequestProducerInput<RulesEvidence, MethodEvidence, PropertyEvidence>) => RequestAst;
    readonly produceResult: (input: RequestProducerInput<RulesEvidence, MethodEvidence, PropertyEvidence>) => RequestProducerResult;
}
