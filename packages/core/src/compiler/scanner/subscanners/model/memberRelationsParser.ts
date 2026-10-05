/**
 * Produces canonical Eloquent relation ASTs directly from the PHP model declaration.
 * Relations are produced directly as canonical EloquentRelationAst values.
 */
import type { ModelName } from '../../../../types/upstream/names';
import type { SourceSpan } from '../../../../types/upstream/provenance';
import type { ModelDeclarationAst } from '../../lexer';
import type { EloquentRelationAst } from '../../../../types/upstream/eloquent';
import { relationFold, relationGate } from '../../../../semantic/foundation/relationalSequence';
import { relationEqual } from '../../../../semantic/foundation/semanticRelations';
import { eloquentRelationProducer } from './eloquentProducer';

export function parseModelRelations(
    declaration: ModelDeclarationAst,
    sourceModel: ModelName,
    source: SourceSpan
): readonly EloquentRelationAst[] {
    return relationFold(declaration.methods, [] as EloquentRelationAst[], (relations, method) => relationFold(method.returns, relations, (next, returned) => {
        const result = eloquentRelationProducer.produce({ method, returned, sourceModel, source });
        return relationGate(relationEqual(result.kind, 'produced'), () => [...next, result.relation],
            () => relationGate(relationEqual(result.kind, 'not_a_relation'), () => next, () => {
                throw Error(`Unsupported Eloquent relation ${result.method.value.value}: ${result.reason} at ${result.source.file.value.value} (offset ${result.source.start.value})`);
            }));
    }));
}
