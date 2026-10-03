import { describe, expect, test } from 'vitest';
import { parseControllerBody } from '../lexer/controllerBodyParser';
import { tokenizePhpSource } from '../lexer/tokenizer';
import { createAstIdentifier } from '../lexer/phpAstTypes';
import { classifyPhpBlock } from '../lexer/astClassifier';
import type { Sequence } from '../../../types/upstream/collections';

describe('ecommerce_shop dataflow boundary Phase 104', () => {
    test('preserves assignments and resolves later references to their local origin', () => {
        const source = "$detail = Payment::find($id); $gateway = $detail['gateway'] ?? null; return $gateway;";
        const body = parseControllerBody(source, tokenizePhpSource(source), [createAstIdentifier('id')]);
        expect(body.statements.map(statement => statement.kind)).toEqual(['assignment', 'assignment', 'return_with_value']);
        const bindings = body.dataflow.semanticVariables.variables.kind === 'empty' ? [] : sequenceValues(body.dataflow.semanticVariables.variables);
        expect(bindings.map(binding => binding.variable.value)).toEqual(['detail', 'gateway']);
        expect(bindings[0]?.definitions.kind).toBe('cons');
        expect(bindings[0]?.definitions.kind === 'cons' ? bindings[0].definitions.head.origin : { kind: 'external' }).toEqual({ kind: 'assignment', statementIndex: { kind: 'number_value', value: 0 } });

function sequenceValues<T>(value: Sequence<T>): readonly T[] {
    return value.kind === 'empty' ? [] : [value.head, ...sequenceValues(value.tail)];
}
        expect(body.dataflow.semanticVariables.variables.kind).toBe('cons');
    });

    test('preserves control-flow statements instead of flattening their bodies', () => {
        const tokens = tokenizePhpSource("if ($ok) { $result = $value; } else { $result = null; } foreach ($items as $key => $item) { $last = $item; }");
        const block = classifyPhpBlock(tokens);
        expect(block.statements.map(statement => statement.kind)).toEqual(['if_statement', 'foreach_statement']);
    });
});
