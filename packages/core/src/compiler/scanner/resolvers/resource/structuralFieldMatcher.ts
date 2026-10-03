/**
 * Declarative structural field matching.
 *
 * Candidate scoring is represented as a relation fold. The scanner observes
 * field evidence; the resolver derives a model witness from that evidence.
 */
import type { ModelSymbolTable } from "../../symbols/ModelSymbolTable";
import type { OriginModelSymbol } from "../../symbols/model/originModelSymbol";
import { matchLookup } from "../../../../types/upstream/collections";
import { createPropertyName, type PropertyName } from "../../../../types/upstream/names";
import { present, absent, type Presence } from "../../../../types/upstream/presence";
import { relationEqual, relationAny } from "../../../../semantic/kernel/semanticRelations";
import { relationResolve, relationFold } from "../../../../semantic/kernel/relationalSequence";
import { relationContains } from "../../../../semantic/kernel/relationMembership";

const GENERIC_COLUMNS = Object.freeze([
    'id', 'created_at', 'updated_at', 'deleted_at', 'status', 'name',
    'type', 'description', 'uuid', 'is_active'
]);

type Candidate = Readonly<{
    readonly model: OriginModelSymbol;
    readonly score: number;
    readonly matchedCount: number;
    readonly distinctiveScore: number;
}>;

type State = Readonly<{
    readonly best: Presence<Candidate>;
    readonly runnerUp: number;
}>;

const emptyState = (): State => ({ best: absent(), runnerUp: 0 });

export function matchStructuralFields(
    fieldNames: readonly PropertyName[],
    modelSymbolTable: ModelSymbolTable,
): Presence<OriginModelSymbol> {
    const state = relationFold(modelSymbolTable.all(), emptyState(), (current, model) => {
        const candidate = relationFold(fieldNames, { model, score: 0, matchedCount: 0, distinctiveScore: 0 }, (score, field) => {
            const lowerField = field.value.value.toLowerCase();
            const column = matchLookup(model.column(field), {
                missing: () => model.column(createPropertyName(lowerField)),
                found: lookup => lookup,
            });
            return relationResolve(
                relationEqual(column.kind, 'found'),
                () => relationResolve(
                    relationContains(GENERIC_COLUMNS, lowerField),
                    () => ({ model, score: score.score + 0.1, matchedCount: score.matchedCount + 1, distinctiveScore: score.distinctiveScore }),
                    () => ({ model, score: score.score + 1.0, matchedCount: score.matchedCount + 1, distinctiveScore: score.distinctiveScore + 1.0 }),
                ),
                () => score,
            );
        });
        const coverage = relationResolve(
            relationEqual(fieldNames.length, 0),
            () => 0,
            () => candidate.matchedCount / fieldNames.length,
        );
        const eligible = relationAll([candidate.matchedCount >= 2, candidate.distinctiveScore >= 1.0, coverage >= 0.4]);
        return relationResolve(
            eligible,
            () => relationResolve(
                relationEqual(current.best.kind, 'absent'),
                () => ({ best: present(candidate), runnerUp: current.runnerUp }),
                () => relationResolve(
                    candidate.score > current.best.value.score,
                    () => ({ best: present(candidate), runnerUp: current.best.value.score }),
                    () => ({ best: current.best, runnerUp: relationResolve(candidate.score > current.runnerUp, () => candidate.score, () => current.runnerUp) }),
                ),
            ),
            () => current,
        );
    }, emptyState());

    return relationResolve(
        relationEqual(state.best.kind, 'absent'),
        () => absent(),
        () => relationResolve(
            relationAny([state.best.value.score - state.runnerUp >= 0.5, relationEqual(state.runnerUp, 0)]),
            () => present(state.best.value.model),
            () => absent(),
        ),
    );
}
