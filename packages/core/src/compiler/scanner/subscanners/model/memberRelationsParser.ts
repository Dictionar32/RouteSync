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
            const result = eloquentRelationProducer.produce({ method, returned, sourceModel, source });
            switch (result.kind) {
                case 'produced':
                    relations.push(result.relation);
                    break;
                case 'not_a_relation':
                    break;
                case 'unsupported':
                    throw new Error(
                        `Unsupported Eloquent relation ${result.method.value.value}: ${result.reason} at ${result.source.file.value.value} (offset ${result.source.start.value})`
                    );
                default: {
                    const exhaustive: never = result;
                    throw new Error(`Unhandled Eloquent relation result: ${String(exhaustive)}`);
                }
            }
        }
    }
    return relations;
}
