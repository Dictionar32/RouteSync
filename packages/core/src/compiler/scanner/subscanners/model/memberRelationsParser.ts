/**
 * Model Member Relations Parser.
 * Scans Eloquent model relationship methods returning $this->hasMany(...), etc.
 *
 * @module core/compiler/scanner/subscanners/model
 */

import {
    type ParsedRelation,
    EloquentRelationClassifier
} from "../../../../types/route";
import type { TokenDescriptor } from "../../LaravelSourceLexer";
import { extractClassBasename } from "../../../../utils/resource-naming";
import { ScannedModelRelationDescriptor } from "../../descriptors/modelDescriptors";

export function tryParseModelRelations(
    tokens: readonly TokenDescriptor[],
    i: number,
    relations: ParsedRelation[]
): void {
    const token = tokens[i];

    // Relations: public function orderDetails(): HasMany { return $this->hasMany(OrderDetail::class); }
    if (token.value === 'function' && tokens[i + 1]?.type === 'IDENTIFIER') {
        const relName = tokens[i + 1].value;
        let k = i + 2;
        while (k < tokens.length && tokens[k].value !== '{' && tokens[k].value !== ';') k++;
        if (tokens[k]?.value === '{') {
            while (k < tokens.length && tokens[k].value !== '}') {
                if (tokens[k].value === '$this' && (tokens[k + 1]?.value === '->' || tokens[k + 1]?.value === '?->')) {
                    const relMethod = tokens[k + 2]?.value;
                    if (EloquentRelationClassifier.isRelationMethod(relMethod)) {
                        const descriptor = EloquentRelationClassifier.getDescriptor(relMethod);
                        if (tokens[k + 3]?.value === '(' && tokens[k + 4]?.type === 'IDENTIFIER') {
                            const relatedModel = tokens[k + 4].value;
                            const modelName = extractClassBasename(relatedModel);
                            relations.push(ScannedModelRelationDescriptor.create({
                                name: relName,
                                type: descriptor.type,
                                modelName,
                                targetModel: relatedModel,
                                cardinality: descriptor.cardinality,
                                isCollection: descriptor.isCollection
                            }));
                        }
                    }
                }
                k++;
            }
        }
    }
}
