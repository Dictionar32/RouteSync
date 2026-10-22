/**
 * PHP controller parameter AST → existing upstream dependency evidence.
 * This adapter only projects parser evidence. Class-name judgment and PHP
 * expression derivation are supplied by their existing upstream authorities.
 */
import { createClassName, type SourceFile, type VariableName } from '../../../types/upstream/names';
import type { ControllerDependencyInjection } from '../../../types/upstream/controller';
import type { ControllerParameterClassNameJudgment } from '../../../types/upstream/controllerParameterClassNameJudgmentInterface';
import type { ControllerDependencySemanticInput } from '../../../types/upstream/controllerDependencySemanticJudgmentInterface';
import type { PhpAstExpressionSemanticAuthorityInterface } from '../../../types/upstream/phpAstExpressionSemanticAuthorityInterface';
import type { ExpressionArgument, ExpressionArguments } from '../../../types/upstream/expression';
import type { Sequence } from '../../../types/upstream/collections';
import type { ControllerParameterAst } from '../lexer/controllerAstTypes';
import type { PhpAstValue } from '../lexer/phpAstExpressionTypes';

export interface ControllerDependencyParameterEvidence {
    readonly parameter: ControllerParameterAst;
    readonly classNameJudgment: ControllerParameterClassNameJudgment;
}

export interface ControllerDependencyEvidenceProjectionInput {
    readonly constructorParameters: readonly ControllerDependencyParameterEvidence[];
    readonly methodParameters: readonly ControllerDependencyParameterEvidence[];
    readonly customContextualAttributeNames: readonly string[];
    readonly sourceFile: SourceFile;
    readonly expressionAuthority: PhpAstExpressionSemanticAuthorityInterface<PhpAstValue>;
}

export interface ControllerDependencyEvidenceProjectionInterface {
    readonly kind: 'controller_dependency_evidence_projection';
    readonly project: (input: ControllerDependencyEvidenceProjectionInput) => readonly ControllerDependencySemanticInput[];
}

export const controllerDependencyEvidenceProjection: ControllerDependencyEvidenceProjectionInterface = Object.freeze({
    kind: 'controller_dependency_evidence_projection',
    project(input): readonly ControllerDependencySemanticInput[] {
        return Object.freeze([
            ...dependencyEvidence(input.constructorParameters, { kind: 'constructor' }, input),
            ...dependencyEvidence(input.methodParameters, { kind: 'method' }, input),
        ]);
    },
});

function dependencyEvidence(
    parameters: readonly ControllerDependencyParameterEvidence[],
    injection: ControllerDependencyInjection,
    input: ControllerDependencyEvidenceProjectionInput,
): readonly ControllerDependencySemanticInput[] {
    return parameters.map(evidence => dependencySemanticInput(evidence, injection, input));
}

function dependencySemanticInput(
    evidence: ControllerDependencyParameterEvidence,
    injection: ControllerDependencyInjection,
    input: ControllerDependencyEvidenceProjectionInput,
): ControllerDependencySemanticInput {
    const parameter = evidence.parameter;
    return Object.freeze({
        injection,
        semantic: parameter.semantic,
        parameter: createVariableName(parameter.name),
        classNameJudgment: evidence.classNameJudgment,
        attributes: Object.freeze(parameter.attributes.map(attribute => Object.freeze({
            name: createClassName(attribute.name),
            arguments: expressionArgumentsFromParameterAttribute(attribute, input),
        }))),
        customContextualAttributeNames: Object.freeze(input.customContextualAttributeNames.map(createClassName)),
    });
}

function expressionArgumentsFromParameterAttribute(
    attribute: ControllerParameterAst['attributes'][number],
    input: ControllerDependencyEvidenceProjectionInput,
): ExpressionArguments {
    const items: readonly ExpressionArgument[] = attribute.arguments.map(argument => {
        const value = input.expressionAuthority.derive({
            kind: 'php_ast_expression_evidence',
            evidence: argument.value,
            sourceFile: input.sourceFile,
            classContext: { kind: 'none' },
        });
        switch (argument.kind) {
            case 'positional': return { kind: 'positional', value };
            case 'unpacked': return { kind: 'unpacked', value };
            case 'named': return {
                kind: 'named',
                name: { kind: 'expression_argument_name', value: { kind: 'string_value', value: argument.name } },
                value,
            };
        }
    });
    return {
        kind: 'expression_arguments',
        items: items.reduceRight<Sequence<ExpressionArgument>>((tail, head) => ({ kind: 'cons', head, tail }), { kind: 'empty' }),
    };
}

function createVariableName(value: ControllerParameterAst['name']): VariableName {
    return { kind: 'variable_name', value: { kind: 'string_value', value } };
}
