/** Relation-backed field transformations and form projection helpers. */
import type { TypeIR } from '../../../types/ir';
import { resolveFieldTransform, type FieldCaseTransform } from './fieldTransformSemanticRelations';
import { relationOptionFold, relationFirstOption } from '../../../semantic/foundation/relationalSequence';
import { relationEqual } from '../../../semantic/foundation/semanticRelations';

const FIELD_TRANSFORMERS: Readonly<Record<FieldCaseTransform, (name: string) => string>> = Object.freeze({
    camel: phpName => phpName.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase()),
    pascal: phpName => phpName.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase()).replace(/^([a-z])/, letter => letter.toUpperCase()),
    snake: phpName => phpName,
    kebab: phpName => phpName.replace(/_/g, '-'),
});

export function transformFieldName(phpName: string, caseTransform: string = 'camel'): string {
    return FIELD_TRANSFORMERS[resolveFieldTransform(caseTransform)](phpName);
}

export function projectForForm(type: TypeIR): TypeIR {
    return relationOptionFold(
        relationFirstOption([type], candidate => relationEqual(candidate.kind, 'nullable')),
        () => type,
        candidate => ({ kind: 'optional', inner: candidate.inner }),
    );
}
