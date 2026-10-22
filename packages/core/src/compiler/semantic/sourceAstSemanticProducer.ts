import path from "node:path";
import { PHP_STATEMENT_KINDS } from "../scanner/lexer/phpAstStatementKinds";
import { expressionProducer } from "../scanner/operations/expressionProducer";
import { propertyProducer } from "../scanner/operations/propertyProducer";
import { relationAsyncFold, relationExpand, relationFirstOption, relationOptionFold, relationGate, relationProject, relationSelect, relationRefine, relationVariant, relationSome, relationNone, relationFold, type RelationOption } from "../../semantic/relations/relationalSequence";
import { relationEqual, relationAll, relationAny } from "../../semantic/relations/semanticRelations";
import type { ExpressionAst } from "../../types/upstream/ast";
import type { Assignment, AssignmentAst } from "../../types/upstream/assignment";
import { createSourceFile } from "../../types/upstream/names";
import { resolveAssignmentTarget, resolveAssignmentOperator, assignmentReferenceMode } from "../scanner/lexer/routeAst/phpAstExpressionMappings";
import { expressionFromPhpAst } from "../scanner/operations/expressionProducer";
import type { PhpStatement, PhpBlock, PhpForClause, PhpIfAlternative, PhpFinallyClause } from "../scanner/lexer/phpAstStatementTypes";
import type { PhpMethodAst } from "../scanner/lexer/phpMethodAstTypes";
import type { PhpAstValue, PhpArrayEntry, PhpArrayKey } from "../scanner/lexer/phpAstExpressionTypes";
import type { PropertyAst } from "../../types/upstream/property";
import { createClassName } from "../../types/upstream/names";
import type { SourceAstSemanticProducerInterface } from "../../types/upstream/sourceAstSemanticProducerInterface";
import type { SourceAstParsedFile } from "../../types/upstream/sourceAstSyntaxParserInterface";
import type { TokenDescriptor, PhpClassPropertyAst } from "../scanner/lexer";
import { sourceAstSyntaxParser } from "./sourceAstSyntaxParser";
import { sourceAstEvidenceAcquisition } from "./sourceAstEvidenceAcquisition";
import { sourceAstSemanticOriginAuthority } from "./sourceAstSemanticOriginAuthority";

const stringValue = (value: string) => ({ kind: "string_value" as const, value });

const sourceSpan = (file: string, start: number, end: number) => ({
    kind: "source_span" as const,
    file: { kind: "source_file" as const, value: stringValue(file) },
    start: { kind: "number_value" as const, value: start },
    end: { kind: "number_value" as const, value: end },
});

type ParsedSourceAstFile = SourceAstParsedFile<PhpMethodAst, PhpClassPropertyAst, TokenDescriptor>;

type StatementOfKind<K extends PhpStatement["kind"]> = Extract<PhpStatement, { readonly kind: K }>;
type AlternativeOfKind<K extends PhpIfAlternative["kind"]> = Extract<PhpIfAlternative, { readonly kind: K }>;
type ClauseOfKind<K extends PhpForClause["kind"]> = Extract<PhpForClause, { readonly kind: K }>;
type FinallyOfKind<K extends PhpFinallyClause["kind"]> = Extract<PhpFinallyClause, { readonly kind: K }>;

const statementIs = <K extends PhpStatement["kind"]>(kind: K) =>
    (statement: PhpStatement): statement is StatementOfKind<K> => relationEqual(statement.kind, kind);
const alternativeIs = <K extends PhpIfAlternative["kind"]>(kind: K) =>
    (alternative: PhpIfAlternative): alternative is AlternativeOfKind<K> => relationEqual(alternative.kind, kind);
const clauseIs = <K extends PhpForClause["kind"]>(kind: K) =>
    (clause: PhpForClause): clause is ClauseOfKind<K> => relationEqual(clause.kind, kind);
const finallyIs = <K extends PhpFinallyClause["kind"]>(kind: K) =>
    (clause: PhpFinallyClause): clause is FinallyOfKind<K> => relationEqual(clause.kind, kind);

const statementExpressionRules: readonly ((statement: PhpStatement) => RelationOption<readonly PhpAstValue[]>)[] = [
    statement => relationOptionFold(relationRefine(statement, statementIs("expression_statement")), () => relationNone(), value => relationSome([value.expression])),
    statement => relationOptionFold(relationRefine(statement, statementIs("return_with_value")), () => relationNone(), value => relationSome([value.expression])),
    statement => relationOptionFold(relationRefine(statement, statementIs("assignment")), () => relationNone(), value => relationSome([value.value])),
    statement => relationOptionFold(relationRefine(statement, statementIs(PHP_STATEMENT_KINDS.conditional)), () => relationNone(), value => relationSome([
        value.condition,
        ...blockExpressions(value.thenBlock),
        ...relationOptionFold(relationRefine(value.alternative, alternativeIs("else_if")),
            () => relationOptionFold(relationRefine(value.alternative, alternativeIs("else_block")),
                () => [],
                alternative => blockExpressions(alternative.block)),
            alternative => statementExpressions(alternative.statement)),
    ])),
    statement => relationOptionFold(relationRefine(statement, statementIs(PHP_STATEMENT_KINDS.collectionRecurrence)), () => relationNone(), value => relationSome([value.iterable, ...blockExpressions(value.body)])),
    statement => relationOptionFold(relationRefine(statement, statementIs("throw_statement")), () => relationNone(), value => relationSome([value.expression])),
    statement => relationOptionFold(relationRefine(statement, statementIs("include_statement")), () => relationNone(), value => relationSome([value.expression])),
    statement => relationOptionFold(relationRefine(statement, statementIs(PHP_STATEMENT_KINDS.countedRecurrence)), () => relationNone(), value => relationSome([
        ...relationOptionFold(relationRefine(value.initializer, clauseIs("empty")), () => relationOptionFold(relationRefine(value.initializer, clauseIs("expression")), () => [], clause => [clause.value]), () => []),
        ...relationOptionFold(relationRefine(value.condition, clauseIs("empty")), () => relationOptionFold(relationRefine(value.condition, clauseIs("expression")), () => [], clause => [clause.value]), () => []),
        ...relationOptionFold(relationRefine(value.update, clauseIs("empty")), () => relationOptionFold(relationRefine(value.update, clauseIs("expression")), () => [], clause => [clause.value]), () => []),
        ...blockExpressions(value.body),
    ])),
    statement => relationOptionFold(relationRefine(statement, statementIs("try_statement")), () => relationNone(), value => relationSome([
        ...blockExpressions(value.body),
        ...relationExpand(value.catches, catchClause => blockExpressions(catchClause.body)),
        ...relationOptionFold(relationRefine(value.finallyBlock, finallyIs("present")), () => [], finallyClause => blockExpressions(finallyClause.block)),
    ])),
];

const statementExpressions = (statement: PhpStatement): readonly PhpAstValue[] =>
    relationOptionFold(
        relationFirstOption(statementExpressionRules, rule => {
            const result = rule(statement);
            return relationEqual(result.kind, "some");
        }),
        () => [],
        rule => relationOptionFold(rule(statement), () => [], value => value),
    );

const blockExpressions = (block: PhpBlock): readonly PhpAstValue[] =>
    relationExpand(block.statements, statementExpressions);

const assignmentAstFromStatement = (statement: Extract<PhpStatement, { readonly kind: "assignment" }>, file: string): AssignmentAst => {
    const source = sourceSpan(file, statement.source.startOffset, statement.source.endOffset);
    const sourceFile = createSourceFile(file);
    const target = resolveAssignmentTarget(
        statement.target,
        (syntax, path) => expressionFromPhpAst.project({ syntax, sourceFile: createSourceFile(path) }),
        file,
    );
    const expression = expressionFromPhpAst.project({ syntax: statement.value, sourceFile });
    const definition: Assignment = {
        kind: "assignment",
        target,
        expression,
        operator: resolveAssignmentOperator(statement.operator.kind),
        reference: assignmentReferenceMode(statement.reference.kind),
        source,
    };
    return { kind: "assignment_ast", definition, source };
};

const statementAssignmentRules: readonly ((statement: PhpStatement, file: string) => RelationOption<readonly AssignmentAst[]>)[] = [
    (statement, file) => relationOptionFold(relationRefine(statement, statementIs("assignment")), () => relationNone(), value => relationSome([assignmentAstFromStatement(value, file)])),
    (statement, file) => relationOptionFold(relationRefine(statement, statementIs(PHP_STATEMENT_KINDS.conditional)), () => relationNone(), value => relationSome([
        ...blockAssignments(value.thenBlock, file),
        ...relationOptionFold(relationRefine(value.alternative, alternativeIs("else_if")),
            () => relationOptionFold(relationRefine(value.alternative, alternativeIs("else_block")),
                () => [],
                alternative => blockAssignments(alternative.block, file)),
            alternative => statementAssignments(alternative.statement, file)),
    ])),
    (statement, file) => relationOptionFold(relationRefine(statement, statementIs(PHP_STATEMENT_KINDS.collectionRecurrence)), () => relationNone(), value => relationSome(blockAssignments(value.body, file))),
    (statement, file) => relationOptionFold(relationRefine(statement, statementIs(PHP_STATEMENT_KINDS.countedRecurrence)), () => relationNone(), value => relationSome([
        ...relationOptionFold(relationRefine(value.initializer, clauseIs("assignment")), () => [], clause => [assignmentAstFromStatement({ kind: "assignment", target: clause.target, operator: clause.operator, reference: clause.reference, value: clause.value, source: clause.source }, file)]),
        ...relationOptionFold(relationRefine(value.update, clauseIs("assignment")), () => [], clause => [assignmentAstFromStatement({ kind: "assignment", target: clause.target, operator: clause.operator, reference: clause.reference, value: clause.value, source: clause.source }, file)]),
        ...blockAssignments(value.body, file),
    ])),
    (statement, file) => relationOptionFold(relationRefine(statement, statementIs("try_statement")), () => relationNone(), value => relationSome([
        ...blockAssignments(value.body, file),
        ...relationExpand(value.catches, catchClause => blockAssignments(catchClause.body, file)),
        ...relationOptionFold(relationRefine(value.finallyBlock, finallyIs("present")), () => [], finallyClause => blockAssignments(finallyClause.block, file)),
    ])),
];

const blockAssignments = (block: PhpBlock, file: string): readonly AssignmentAst[] =>
    relationExpand(block.statements, statement => statementAssignments(statement, file));

const statementAssignments = (statement: PhpStatement, file: string): readonly AssignmentAst[] =>
    relationOptionFold(
        relationFirstOption(statementAssignmentRules, rule => relationEqual(rule(statement, file).kind, "some")),
        () => [],
        rule => relationOptionFold(rule(statement, file), () => [], value => value),
    );

type ResourceFieldEvidence = { readonly syntax: PhpAstValue; readonly field: string };
const valueIsNestedArray = (value: PhpAstValue): value is Extract<PhpAstValue, { readonly kind: "nested_array" }> => relationEqual(value.kind, "nested_array");
type KeyedStringEntry = Extract<PhpArrayEntry, { readonly kind: "keyed" }> & { readonly key: Extract<PhpArrayKey, { readonly kind: "string" }> };
const entryIsKeyed = (entry: PhpArrayEntry): entry is Extract<PhpArrayEntry, { readonly kind: "keyed" }> => relationEqual(entry.kind, "keyed");
const entryIsKeyedString = (entry: PhpArrayEntry): entry is KeyedStringEntry =>
    relationOptionFold(relationRefine(entry, entryIsKeyed),
        () => false,
        candidate => relationEqual(candidate.key.kind, "string"));
const statementIsReturn = statementIs("return_with_value");

const resourceFieldEvidence = (parsed: PhpMethodAst): readonly ResourceFieldEvidence[] =>
    relationFold(parsed.body, [] as ResourceFieldEvidence[], (fields, statement) =>
        relationOptionFold(relationRefine(statement, statementIsReturn), () => fields, value =>
            relationOptionFold(relationRefine(value.expression, valueIsNestedArray), () => fields, array => [
                ...fields,
                ...relationProject(
                    relationSelect(array.entries, entryIsKeyedString),
                    entry => ({ syntax: entry.value, field: entry.key.value }),
                ),
            ]),
        ),
    );

const expressionOrigin = (sourceKind: ParsedSourceAstFile["evidence"]["sourceKind"], owner: string, method: string, field: string) =>
    sourceAstSemanticOriginAuthority.resolve({
        kind: "source_ast_semantic_origin_evidence",
        sourceKind,
        owner,
        member: method,
        field,
        closed: true,
    }).origin;

const expressionAstsFromMethod = (
    file: string,
    owner: string,
    method: string,
    directoryKind: ParsedSourceAstFile["evidence"]["sourceKind"],
    parsed: PhpMethodAst,
): readonly ExpressionAst[] => {
    const resourceEvidence = relationGate(relationEqual(directoryKind, "resource"), () => resourceFieldEvidence(parsed), () => [] as ResourceFieldEvidence[]);
    const resourceExpressions = relationProject(resourceEvidence, evidence => expressionProducer.produce({
        syntax: evidence.syntax,
        origin: expressionOrigin(directoryKind, owner, method, evidence.field),
        source: sourceSpan(file, evidence.syntax.source.startOffset, evidence.syntax.source.endOffset),
    }));
    const ordinaryExpressions = relationProject(relationExpand(parsed.body, statementExpressions), syntax => expressionProducer.produce({
        syntax,
        origin: expressionOrigin(directoryKind, owner, method, ""),
        source: sourceSpan(file, syntax.source.startOffset, syntax.source.endOffset),
    }));
    return relationGate(relationEqual(directoryKind, "resource"), () => resourceExpressions, () => ordinaryExpressions);
};

const scanPropertyAsts = async (files: readonly ParsedSourceAstFile[]): Promise<readonly PropertyAst[]> => {
    const modelFiles = relationSelect(files, file => relationEqual(file.evidence.sourceKind, "model"));
    const result = await relationAsyncFold(modelFiles, [] as PropertyAst[], async (accumulator, parsedFile) => {
        const sourceFile = sourceSpan(parsedFile.evidence.path, 0, parsedFile.evidence.text.length);
        const produced = relationProject(parsedFile.properties, property => propertyProducer.produce({
            property,
            context: { kind: "class_property", owner: createClassName(path.basename(parsedFile.evidence.path, ".php")), declaration: { kind: "class_property", owner: createClassName(path.basename(parsedFile.evidence.path, ".php")), role: { kind: "ordinary" } } },
            source: sourceFile,
        }));
        return relationFold(produced, accumulator, (items, value) => [...items, value]);
    }, 0);
    return Object.freeze(result);
};

const scanSourceExpressionAndAssignmentAsts = async (files: readonly ParsedSourceAstFile[]): Promise<{ readonly expressions: readonly ExpressionAst[]; readonly assignments: readonly AssignmentAst[] }> => {
    const state = await relationAsyncFold(files, { expressions: [] as ExpressionAst[], assignments: [] as AssignmentAst[] }, async (fileState, parsedFile) => {
        const evidence = parsedFile.evidence;
        const kind = evidence.sourceKind;
        const file = evidence.path;
        const owner = parsedFile.owner;
        const methods = relationExpand(parsedFile.methods, method => {
            const accepted = relationGate(relationEqual(kind, "model"), () => {
                const legacy = relationAll([valueStartsWith(method.name, "get"), valueEndsWith(method.name, "Attribute")]);
                const modern = relationAll([
                    relationOptionFold(relationVariant(method.declaredReturnType, "declared"), () => false, declared =>
                        relationOptionFold(relationVariant(declared.type, "named"), () => false, named => relationEqual(named.name, "Attribute"))),
                ]);
                return relationAny([legacy, modern]);
            }, () => true);
            return relationGate(accepted, () => [{
                expression: expressionAstsFromMethod(file, owner, method.name, kind, method),
                assignments: relationExpand(method.body, statement => statementAssignments(statement, file)),
            }], () => []);
        });
        const expressions = relationExpand(methods, value => value.expression);
        const assignments = relationExpand(methods, value => value.assignments);
        return {
            expressions: relationFold(expressions, fileState.expressions, (items, values) => [...items, values]),
            assignments: relationFold(assignments, fileState.assignments, (items, values) => [...items, values]),
        };
    }, 0);
    return { expressions: Object.freeze(state.expressions), assignments: Object.freeze(state.assignments) };
};

const valueStartsWith = (value: string, prefix: string): boolean => relationEqual(value.startsWith(prefix), true);
const valueEndsWith = (value: string, suffix: string): boolean => relationEqual(value.endsWith(suffix), true);




export const sourceAstSemanticProducer: SourceAstSemanticProducerInterface = Object.freeze({
    kind: "source_ast_semantic_producer",
    closed: true,
    async produce(sourceProject) {
        const evidence = await sourceAstEvidenceAcquisition.acquire(sourceProject);
        const parsed = sourceAstSyntaxParser.parse(evidence.files);
        const source = await scanSourceExpressionAndAssignmentAsts(parsed.files);
        const properties = await scanPropertyAsts(parsed.files);
        return Object.freeze({
            expressions: source.expressions,
            assignments: source.assignments,
            properties,
        });
    },
});
