/**
 * Semantic relation derivation from the canonical ModelDeclarationAst.
 * Syntax/token recognition is owned by the lexer AST producer.
 */
import { ModelRelationClassifier } from "../../../../types/upstream/modelVocabulary";
import type { ModelRelationFact } from "../../../../types/upstream/modelSourceFacts";
import { extractClassBasename } from "../../../../utils/resource-naming";
import { createModelName, createClassName, createRelationName } from "../../../../types/upstream/names";
import type { ModelDeclarationAst } from "../../lexer";
import type { TypeExpression } from "../../../../types/upstream/typeVocabulary";

export function parseModelRelations(
    declaration: ModelDeclarationAst,
    sourceModel: import("../../../../types/upstream/names").ModelName,
    relations: ModelRelationFact[],
    source: import("../../../../types/upstream/provenance").SourceSpan
): void {
    for (const method of declaration.methods) {
        for (const returned of method.returns) {
            if (returned.kind !== 'method_chain') continue;
            if (returned.receiver.kind !== 'variable_reference' || returned.receiver.name.value !== 'this') continue;
            if (!ModelRelationClassifier.isRelationMethod(returned.property.value)) continue;
            const related = returned.arguments[0]?.value;
            if (related?.kind !== 'class_reference') continue;
            const relationType = returned.property.value;
            const descriptor = ModelRelationClassifier.descriptor(relationType);
            const modelName = extractClassBasename(related.className.value);
            const targetModel = createModelName(modelName);
            const modelReference: TypeExpression = { kind: 'reference', value: { kind: 'class', name: createClassName(modelName) } };
            const semanticType: TypeExpression = descriptor.isCollection ? { kind: 'array', element: modelReference } : modelReference;
            relations.push({
                name: createRelationName(method.name.value),
                sourceModel,
                relation: descriptor.relation,
                eloquentType: relationType,
                targetModel,
                cardinality: descriptor.cardinality,
                multiplicity: descriptor.isCollection ? { kind: 'collection' } : { kind: 'single' },
                semanticType,
                targetShape: descriptor.isCollection ? { kind: 'collection', model: targetModel } : { kind: 'single', model: targetModel },
                traversalTarget: descriptor.isCollection ? { kind: 'collection', model: targetModel } : { kind: 'model', model: targetModel },
                key: { kind: 'convention' },
                source
            });
        }
    }
}
