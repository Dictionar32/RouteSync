import type { ModelCast } from '../../../types/upstream/model';
import type { ModelAccessorFact } from '../../../types/upstream/modelSourceFacts';
import type { EloquentRelationAst } from '../../../types/upstream/eloquent';
import type { ModelAst, MigrationAst } from '../../../types/upstream/ast';
import type { PhpClassPropertyAst, ModelDeclarationAst } from '../lexer';
import { buildModelSemanticDefinitionFromAst } from './model/modelParser';
import { modelAstFromSemantic } from './model/modelCanonical';
import { resolveModelSchema } from './model';

export type ModelProducerInput = {
    readonly sourceSpan: import('../../../types/upstream/provenance').SourceSpan;
    readonly migrations: readonly MigrationAst[];
    readonly propertyAsts: readonly PhpClassPropertyAst[];
    readonly declaration: ModelDeclarationAst;
    readonly casts: readonly ModelCast[];
    readonly accessors: readonly ModelAccessorFact[];
    readonly eloquentRelations: readonly EloquentRelationAst[];
};

export interface ModelProducer {
    readonly produce: (input: ModelProducerInput) => ModelAst;
}

const modelProducer: ModelProducer = {
    produce(input): ModelAst {
        const relations = input.eloquentRelations;
        const semantic = buildModelSemanticDefinitionFromAst(
            input.sourceSpan,
            input.migrations,
            input.propertyAsts,
            input.declaration,
            input.casts,
            input.accessors,
            relations,
        );
        const schema = resolveModelSchema(semantic.identity.table, input.migrations);
        return modelAstFromSemantic(
            semantic,
            schema,
            input.casts,
            input.accessors,
            relations,
            input.sourceSpan,
        );
    },
};

export { modelProducer };
