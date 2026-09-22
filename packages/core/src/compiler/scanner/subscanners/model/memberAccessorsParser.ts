/**
 * Semantic accessor derivation from the canonical ModelDeclarationAst.
 * Syntax/token recognition is owned by the lexer AST producer.
 */
import type { ModelAccessorFact } from "../../../../types/upstream/modelSourceFacts";
import type { ModelDeclarationAst } from "../../lexer";
import { mapModelAccessorReturnExpression } from "./modelAccessorExpressionMapper";
import type { TypeExpression } from "../../../../types/upstream/typeVocabulary";

type AccessorReturnType = 'textual' | 'numeric' | 'boolean' | 'array';

function accessorSemanticType(type: AccessorReturnType): TypeExpression {
    const map = { textual: { kind: 'string' }, numeric: { kind: 'number' }, boolean: { kind: 'boolean' }, array: { kind: 'json' } } as const;
    return { kind: 'primitive', value: map[type] };
}

function parseAccessorReturnType(value: string): AccessorReturnType {
    switch (value.toLowerCase()) {
        case 'float':
        case 'int':
        case 'integer':
        case 'number': return 'numeric';
        case 'bool':
        case 'boolean': return 'boolean';
        case 'array': return 'array';
        default: return 'textual';
    }
}

export function parseModelAccessors(declaration: ModelDeclarationAst, accessors: ModelAccessorFact[], source: import("../../../../types/upstream/provenance").SourceSpan): void {
    for (const method of declaration.methods) {
        const name = method.name.value;
        const legacy = name.startsWith('get') && name.endsWith('Attribute');
        const modern = method.returnType.kind === 'class_reference' && method.returnType.className.value === 'Attribute';
        if (!legacy && !modern) continue;
        const propertyName = legacy
            ? `${name.slice(3, -9).charAt(0).toLowerCase()}${name.slice(3, -9).slice(1)}`
            : name;
        const hinted = method.returnType.kind === 'class_reference' ? method.returnType.className.value : 'string';
        const result = accessorSemanticType(modern ? 'textual' : parseAccessorReturnType(hinted));
        const returned = method.returns[0];
        accessors.push({
            name: { kind: 'method_name', value: { kind: 'string_value', value: name } },
            propertyName: { kind: 'property_name', value: { kind: 'string_value', value: propertyName } },
            computation: returned
                ? { kind: 'expression', expression: mapModelAccessorReturnExpression(returned), result }
                : { kind: 'rejected', reason: 'missing_return_expression', result },
            result,
            source
        });
    }
}
