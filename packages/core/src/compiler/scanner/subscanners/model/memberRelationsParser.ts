/**
 * Produces canonical Eloquent relation ASTs directly from the PHP model declaration.
 * Relations are produced directly as canonical EloquentRelationAst values.
 */
import type { ModelName } from '../../../../types/upstream/names';
import type { SourceSpan } from '../../../../types/upstream/provenance';
import type { ModelDeclarationAst } from '../../lexer';
import type { EloquentRelationAst } from '../../../../types/upstream/eloquent';
import { eloquentRelationProducer } from './eloquentProducer';

export function parseModelRelations(
    declaration: ModelDeclarationAst,
    sourceModel: ModelName,
    source: SourceSpan
): readonly EloquentRelationAst[] {
    const relations: EloquentRelationAst[] = [];
    for (const method of declaration.methods) {
        for (const returned of method.returns) {
            const relationAst = eloquentRelationProducer.produce({ method, returned, sourceModel, source });
            if (relationAst !== undefined) relations.push(relationAst);
        }
    }
    return relations;
}
