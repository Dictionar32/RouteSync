import { describe, expect, test } from 'vitest';
import { controllerBodyParser } from '../../frontend/php/controllerBodyParser';
import { phpSourceTokenizer } from '../../frontend/php/tokenizer';
import { sourceFileIdentityFactory, stringValue } from '../../../types/upstream/names';
import { laravelControllerInvocationSemanticJudgmentAuthority, laravelControllerInvocationSemanticInputFactory } from '../../../types/upstream/laravelControllerInvocationSemanticJudgmentAuthority';
import { classifyPhpBlock } from '../../frontend/php/astClassifier';
import type { Sequence } from '../../../types/upstream/collections';
import { INVOCATION_SEMANTIC_EXECUTION_RULE_IDS } from '../../../types/upstream/invocationSemanticJudgmentInterface';
import type { InvocationSemanticCoveragePublicationResult } from '../../../types/upstream/invocationSemanticPipelineInterface';
import type { InvocationSemanticAnalysis } from '../../../types/upstream/invocationSemanticJudgmentInterface';

function sequenceValues<T>(value: Sequence<T>): readonly T[] {
    return value.kind === 'empty' ? [] : [value.head, ...sequenceValues(value.tail)];
}

const testInvocationContext = () => Object.freeze({
    kind: 'invocation_semantic_judgment' as const,
    judgment: laravelControllerInvocationSemanticJudgmentAuthority.judge(laravelControllerInvocationSemanticInputFactory.withoutPipeline(sourceFileIdentityFactory.create(stringValue.create('<phase104-test>')))),
});

function integratedAnalysis(response: InvocationSemanticCoveragePublicationResult): InvocationSemanticAnalysis {
    return response.continueWith({
        onValidated: result => result.validation.analysis,
        onRejected: result => result.analysis,
    });
}

describe('ecommerce_shop dataflow boundary Phase 104', () => {
    test('preserves assignments and resolves later references to their local origin', () => {
        const source = "$detail = Payment::find($id); $gateway = $detail['gateway'] ?? null; return $gateway;";
        const body = controllerBodyParser.parse(source, phpSourceTokenizer.tokenize(source), [], testInvocationContext());
        expect(body.statements.map(statement => statement.kind)).toEqual(['assignment', 'assignment', 'return_with_value']);
        const bindings = body.dataflow.semanticVariables.variables.kind === 'empty' ? [] : sequenceValues(body.dataflow.semanticVariables.variables);
        expect(bindings.map(binding => binding.variable.value)).toEqual(['detail', 'gateway']);
        expect(bindings[0]?.definitions.kind).toBe('cons');
        expect(bindings[0]?.definitions.kind === 'cons' ? bindings[0].definitions.head.origin : { kind: 'external' }).toEqual({ kind: 'assignment', statementIndex: { kind: 'statement_index', ordinal: { kind: 'number_value', value: 0 } } });
        expect(body.dataflow.semanticVariables.variables.kind).toBe('cons');
        const response = body.dataflow.invocationSemanticIntegratedResponse.response.publication;
        const analysis = integratedAnalysis(response);
        expect(analysis.kind).toBe('invocation_semantic_analysis');
        expect(analysis).toBe(integratedAnalysis(response));
    });

    test('routes invocation evidence through the upstream judgment executor', () => {
        const source = '$result = resolveValue($id); return $result;';
        const body = controllerBodyParser.parse(source, phpSourceTokenizer.tokenize(source), [], testInvocationContext());
        expect(body.dataflow.semanticKnowledgeDataFlow.facts.some(fact => fact.kind === 'invocation')).toBe(true);
        const response = body.dataflow.invocationSemanticIntegratedResponse.response.publication;
        const analysis = integratedAnalysis(response);
        expect(analysis).toBe(integratedAnalysis(response));
        expect(['validated-publication', 'rejected-publication']).toContain(response.kind);
        expect(analysis.kind).toBe('invocation_semantic_analysis');
        expect(analysis.judgments).toHaveLength(1);
        expect(analysis.judgments[0]?.status).toBe('incomplete');
        const judgment = analysis.judgments[0];
        expect(judgment?.proof.ruleTrace).toHaveLength(9);
        expect(judgment?.proof.ruleTrace.map(entry => entry.ruleId)).toEqual([...INVOCATION_SEMANTIC_EXECUTION_RULE_IDS, 'invocation-judgment-closure']);
        expect(judgment?.proof.ruleTrace.find(entry => entry.ruleId === 'invocation-unresolved-target-obligation')?.witnesses).toHaveLength(1);
        expect(analysis.unresolvedObligations.some(obligation => obligation.kind === 'callable_target_unresolved')).toBe(true);
    });

    test('preserves control-flow statements instead of flattening their bodies', () => {
        const tokens = phpSourceTokenizer.tokenize("if ($ok) { $result = $value; } else { $result = null; } foreach ($items as $key => $item) { $last = $item; }");
        const block = classifyPhpBlock(tokens);
        expect(block.statements.map(statement => statement.kind)).toEqual(['if_statement', 'foreach_statement']);
    });
});
