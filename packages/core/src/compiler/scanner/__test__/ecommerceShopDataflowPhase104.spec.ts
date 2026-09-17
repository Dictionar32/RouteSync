import { describe, expect, test } from 'vitest';
import { parseControllerBody } from '../lexer/controllerBodyParser';
import { tokenizePhpSource } from '../lexer/tokenizer';
import { createAstIdentifier } from '../lexer/phpAstTypes';
import { classifyPhpBlock } from '../lexer/astClassifier';

describe('ecommerce_shop dataflow boundary Phase 104', () => {
    test('preserves assignments and resolves later references to their local origin', () => {
        const source = "$detail = Payment::find($id); $gateway = $detail['gateway'] ?? null; return $gateway;";
        const body = parseControllerBody(source, tokenizePhpSource(source), [createAstIdentifier('id')]);
        expect(body.statements.map(statement => statement.kind)).toEqual(['assignment', 'assignment', 'return_with_value']);
        expect(body.dataflow.definitions.map(definition => definition.name)).toEqual(['detail', 'gateway']);
        const detailReference = body.dataflow.references.find(reference => reference.name === 'detail');
        expect(detailReference?.origin).toEqual({ kind: 'local_assignment', statementIndex: 0 });
        const idReference = body.dataflow.references.find(reference => reference.name === 'id');
        expect(idReference?.origin).toEqual({ kind: 'parameter' });
        const gatewayReference = body.dataflow.references.find(reference => reference.name === 'gateway');
        expect(gatewayReference?.origin).toEqual({ kind: 'local_assignment', statementIndex: 1 });
    });

    test('preserves control-flow statements instead of flattening their bodies', () => {
        const tokens = tokenizePhpSource("if ($ok) { $result = $value; } else { $result = null; } foreach ($items as $key => $item) { $last = $item; }");
        const block = classifyPhpBlock(tokens);
        expect(block.statements.map(statement => statement.kind)).toEqual(['if_statement', 'foreach_statement']);
    });
});
