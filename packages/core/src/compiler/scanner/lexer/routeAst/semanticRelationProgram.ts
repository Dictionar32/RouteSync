import { relationResolve } from '../../../relational/sequence';
import { relationFirst, relationOptionFold, relationSome, relationNone, relationGate } from '../../../../semantic/kernel/relationalSequence';
import { relationEqual, relationNotEqual } from '../../../../semantic/kernel/semanticRelations';
import { relationContains, relationInsert, type RelationMembership } from '../../../../semantic/kernel/relationMembership';
/**
 * Declarative relation-program validation.
 *
 * This is compiler infrastructure, not domain semantics: a semantic program
 * declares relation schemas and rewrite rules; this module verifies that the
 * program is well-formed before the generic solver executes it.
 */
import type { SemanticConstraintRule } from './semanticConstraintCalculus';
import { project, retain, visit } from './semanticRelationalCollections';
import type { SemanticRelationPattern, SemanticRelationRewrite, SemanticRelationAtom, SemanticRelationVariable, } from './semanticRewriteEngine';
export interface SemanticRelationSchema<R extends string = string> {
    readonly relation: R;
    readonly arity: number;
}
export interface SemanticRelationProgram<R extends string = string> {
    readonly schemas: readonly SemanticRelationSchema<R>[];
    readonly constraints?: readonly SemanticConstraintRule<R>[];
    readonly rules: readonly SemanticRelationRewrite<R>[];
}
export interface SemanticRelationProgramDiagnostic {
    readonly ruleId: string;
    readonly code: 'unknown-relation' | 'arity-mismatch' | 'unbound-variable' | 'unsafe-negation';
    readonly message: string;
}
const isVariable = (term: SemanticRelationAtom | SemanticRelationVariable): term is SemanticRelationVariable =>
    relationGate(
        Object.is(typeof term, 'object'),
        () => Object.hasOwn(term as object, 'variable'),
        () => false,
    );
export const validateSemanticRelationProgram = <R extends string>(program: SemanticRelationProgram<R>): readonly SemanticRelationProgramDiagnostic[] => {
    const schemaEntries = project(program.schemas, schema => [schema.relation, schema] as const);
    const diagnostics: SemanticRelationProgramDiagnostic[] = [];
    const validatePattern = (rule: SemanticRelationRewrite<R>, pattern: SemanticRelationPattern<R>, boundVariables: RelationMembership<string>, output: boolean): void => {
        const schema = relationOptionFold(
            relationFirst(schemaEntries, ([relation]) => relationEqual(relation, pattern.relation)),
            () => relationNone(),
            entry => relationSome(entry[1]),
        );
        relationOptionFold(schema,
            () => diagnostics.push({
                ruleId: rule.id,
                code: 'unknown-relation',
                message: `Unknown relation "${pattern.relation}".`,
            }),
            descriptor => relationResolve(relationNotEqual(descriptor.arity, pattern.arguments.length),
                () => diagnostics.push({
                    ruleId: rule.id,
                    code: 'arity-mismatch',
                    message: `Relation "${pattern.relation}" expects ${descriptor.arity} arguments but received ${pattern.arguments.length}.`,
                }),
                () => {}),
        );
        visit(pattern.arguments, term => {
            relationResolve(isVariable(term),
                () => {
                    const variable = (term as SemanticRelationVariable).variable;
                    relationResolve(relationAll([output, relationEqual(relationContains(boundVariables, variable), false)]),
                        () => diagnostics.push({
                            ruleId: rule.id,
                            code: 'unbound-variable',
                            message: `Rewrite output variable "${variable}" is not bound by the rule premises.`,
                        }),
                        () => relationResolve(relationAll([relationEqual(output, false), relationEqual(pattern.polarity, 'negative'), relationEqual(relationContains(boundVariables, variable), false)]),
                            () => diagnostics.push({
                                ruleId: rule.id,
                                code: 'unsafe-negation',
                                message: `Negative relation variable "${variable}" must be bound by an earlier positive premise.`,
                            }),
                            () => relationResolve(relationAll([relationEqual(output, false), relationNotEqual(pattern.polarity, 'negative')]),
                                () => relationInsert(boundVariables, variable),
                                () => {}),
                        ),
                    );
                },
                () => {},
            );
        });
    };
    visit(program.rules, rule => {
        let boundVariables: RelationMembership<string> = [];
        visit(rule.when, pattern => validatePattern(rule, pattern, boundVariables, false));
        visit(rule.then, pattern => validatePattern(rule, pattern, boundVariables, true));
    });
    return Object.freeze(diagnostics);
};
export const assertSemanticRelationProgram = <R extends string>(program: SemanticRelationProgram<R>): void => {
    const diagnostics = validateSemanticRelationProgram(program);
    relationResolve(relationEqual(diagnostics.length, 0), () => {}, () => (() => {
        throw Error(project(diagnostics, diagnostic => `${diagnostic.ruleId}: ${diagnostic.message}`).join('\n'));
    })());
};
