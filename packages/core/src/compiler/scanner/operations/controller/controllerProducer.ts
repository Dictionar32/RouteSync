import { createDomainAstJudgment } from '../../../../types/upstream/ast';
import type { ControllerProducer } from '../../../../types/upstream/controllerProducerInterface';
import type { ControllerMethodEvidence } from '../../../../types/upstream/controllerEvidence';
import type { ControllerName } from '../../../../types/upstream/names';
import type { SourceSpan } from '../../../../types/upstream/provenance';
import type { ControllerMethod, ControllerMethodContract } from '../../../../types/upstream/controller';
import type { ControllerActionFlowContract } from '../../../../types/upstream/highLevelContracts';
import type { Sequence } from '../../../../types/upstream/collections';
import type { ControllerResponseAttributeSourceEvidence } from '../../../../types/upstream/controllerEvidence';


const sequence = <T>(items: readonly T[]): Sequence<T> => items.reduceRight<Sequence<T>>((tail, item) => ({ kind: 'cons', head: item, tail }), { kind: 'empty' });

const implementation: ControllerProducer = {
    kind: 'controller_producer',
    contract: Object.freeze({
        kind: 'controller_producer_contract',
        version: 5,
        inputOwnership: 'controller-declaration-evidence-and-one-source-correlated-invocation-judgment-are-the-only-input-authorities',
        projectionRule: 'producer-projects-declared-method-actions-and-method-contracts-without-reclassifying-invocation-judgments',
        sourceRule: 'canonical-controller-ast-source-file-comes-from-the-invocation-judgment-and-declaration-offsets-remain-source-derived',
        invocationRule: 'producer-forwards-the-exact-source-correlated-invocation-judgment-and-its-integrated-response-without-reconstruction-or-reclassification',
        methodEvidenceProjectionRule: 'producer-projects-method-AST-observations-and-precomputed-action-contracts-into-closed-controller-method-evidence-without-reclassifying-action-semantics',
        responseAttributeProvenanceRule: 'declared-response-attribute-evidence-retains-the-exact-parser-token-span-and-never-substitutes-the-whole-method-span',
    }),
    projectMethodEvidence: (input): ControllerMethodEvidence => Object.freeze({
        kind: 'controller_method_evidence',
        controller: input.controller,
        action: input.action,
        contract: input.contract,
        source: Object.freeze({
            kind: 'source_span',
            file: input.sourceFile,
            start: Object.freeze({ kind: 'number_value', value: input.method.source.startOffset }),
            end: Object.freeze({ kind: 'number_value', value: input.method.source.endOffset }),
        }),
        responseAttribute: (() : ControllerResponseAttributeSourceEvidence => {
            switch (input.method.responseAttribute.kind) {
                case 'response_attribute_not_declared':
                    return Object.freeze({ kind: 'response_attribute_not_declared' });
                case 'response_attribute_declared':
                    return Object.freeze({
                        kind: 'response_attribute_declared',
                        response: { kind: 'response_reference', name: input.method.responseAttribute.responseName },
                        shape: input.method.responseAttribute.shape,
                        classNameResolutionContext: input.method.responseAttribute.classNameResolutionContext,
                        source: Object.freeze({
                            kind: 'source_span',
                            file: input.sourceFile,
                            start: Object.freeze({ kind: 'number_value', value: input.method.responseAttribute.source.startOffset }),
                            end: Object.freeze({ kind: 'number_value', value: input.method.responseAttribute.source.endOffset }),
                        }),
                    });
            }
        })(),
        returnExpressions: Object.freeze(input.method.returns.map((returnStatement) => Object.freeze({
            kind: 'controller_return_expression_evidence',
            source: Object.freeze({
                kind: 'source_span',
                file: input.sourceFile,
                start: Object.freeze({ kind: 'number_value', value: returnStatement.source.startOffset }),
                end: Object.freeze({ kind: 'number_value', value: returnStatement.expression.source.endOffset }),
            }),
            expressionSource: Object.freeze({
                kind: 'source_span',
                file: input.sourceFile,
                start: Object.freeze({ kind: 'number_value', value: returnStatement.expression.source.startOffset }),
                end: Object.freeze({ kind: 'number_value', value: returnStatement.expression.source.endOffset }),
            }),
            expressionKind: returnStatement.expression.kind,
        }))),
    }),
    produce: (input) => {
        const source: SourceSpan = Object.freeze({
            kind: 'source_span',
            file: input.invocationJudgment.sourceFile,
            start: input.declaration.source.start,
            end: input.declaration.source.end,
        });
        const methodValues: readonly ControllerActionFlowContract[] = input.declaration.methods.map(({ action }) => action);
        const actions: readonly ControllerActionFlowContract[] = Object.freeze([...methodValues]);
        const methods: Sequence<ControllerMethod> = sequence(methodValues);
        const contracts: Sequence<ControllerMethodContract> = sequence(input.declaration.methods.map(({ contract }) => contract));
        return {
            ast: createDomainAstJudgment({ kind: 'controller_ast', semantic: methods, source }),
            actions,
            methods: contracts,
            invocationJudgment: input.invocationJudgment,
        };
    },
};

export const controllerProducer: ControllerProducer = implementation;
