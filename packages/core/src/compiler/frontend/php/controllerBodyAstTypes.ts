/** Typed AST for controller-body facts consumed by semantic resolution. */
import type { AstIdentifier, SourceRange, TokenDescriptor, PhpAstValue, PhpBlock, PhpStatement } from './phpAstTypes';
import type { ControllerVariableSemantic } from '../../../types/upstream/controller';
import type { SemanticKnowledgeDataFlow } from './routeAst/semanticKnowledgeDataFlowRelations';
import type { ControllerDataflowSemanticJudgment } from '../../../types/upstream/controllerDataflowSemanticJudgmentAuthorityInterface';
import type { ControllerDataflowBindingSemanticJudgmentInterface } from '../../../types/upstream/controllerDataflowInvocationSemanticModelInterface';
import type { ControllerDataflowAnalysisBlocked } from '../../../types/upstream/controllerDataflowAnalysisOutcomeInterface';
import type { PhpControllerDataflowPayload } from './routeAst/phpControllerDataflowSourcePayloadEvidenceAdapter';
import type { LaravelControllerAstProjectionResponseJudgment, LaravelControllerInvocationSemanticJudgmentInterface } from '../../../types/upstream/laravelControllerInvocationSemanticJudgmentInterface';

import { relationAll, relationGate } from '../../../semantic/relations/semanticRelations';

export type ValidationRuleLiteralAst = string & { readonly __validationRuleAst: unique symbol };

export interface InlineValidationAst {
    readonly field: AstIdentifier;
    readonly rules: readonly ValidationRuleLiteralAst[];
    readonly source: SourceRange;
}

export type HttpErrorStatusAst = number & { readonly __httpErrorStatusAst: unique symbol };

export interface ControllerErrorAst {
    readonly status: HttpErrorStatusAst;
    readonly source: TokenDescriptor;
}

/**
 * Scanner AST projection of the upstream semantic model. Parser-specific payload
 * types are parameterized into the upstream binding judgment; correspondence,
 * identity, and resolved definition remain correlated per binding.
 */
type ControllerDataflowBinding = Extract<SemanticKnowledgeDataFlow['facts'][number], { readonly kind: 'binding' }>['value'];
type ControllerDataflowPayload = Readonly<{
    readonly statementIndex: import('../../../types/upstream/valueObjects').StatementIndex;
    readonly value: PhpAstValue;
}>;
export type ControllerDataflowBindingJudgment = ControllerDataflowBindingSemanticJudgmentInterface<
    ControllerDataflowBinding,
    ControllerDataflowPayload
>;

export interface ControllerDataflowAst extends ControllerDataflowSemanticJudgment<ControllerDataflowPayload> {}
export type ControllerDataflowPayloadJudgment = ControllerDataflowAst['payloadJudgments'][number];

interface ControllerBodyAstEvidence {
    readonly statements: readonly PhpStatement[];
    readonly validations: readonly InlineValidationAst[];
    readonly errors: readonly ControllerErrorAst[];
}

/** Syntax-only AST is a distinct ADT case, not a semantic result with a missing field. */
export interface SyntaxOnlyControllerBodyAst extends ControllerBodyAstEvidence {
    readonly kind: 'controller_body_syntax_only';
    readonly dataflow: undefined;
}

/** Semantic AST means a canonical dataflow judgment is present; it does not imply invocation integration completed. The exact invocation outcome remains nested in that judgment. */
export interface SemanticControllerBodyAst extends ControllerBodyAstEvidence {
    readonly kind: 'controller_body_semantic';
    readonly dataflow: ControllerDataflowAst;
}

/** Integrated AST retains the exact upstream response judgment rather than dropping it after projection. */
export interface BlockedSemanticControllerBodyAst extends ControllerBodyAstEvidence {
    readonly kind: 'controller_body_semantic_blocked';
    readonly outcome: ControllerDataflowAnalysisBlocked<PhpControllerDataflowPayload>;
}

export interface IntegratedBlockedSemanticControllerBodyAst extends ControllerBodyAstEvidence {
    readonly kind: 'controller_body_semantic_blocked_integrated';
    readonly outcome: ControllerDataflowAnalysisBlocked<PhpControllerDataflowPayload>;
    readonly responseJudgment: LaravelControllerAstProjectionResponseJudgment<LaravelControllerInvocationSemanticJudgmentInterface>;
}

export interface IntegratedSemanticControllerBodyAst<
    InvocationJudgment extends LaravelControllerInvocationSemanticJudgmentInterface = LaravelControllerInvocationSemanticJudgmentInterface,
> extends SemanticControllerBodyAst {
    readonly responseJudgment: LaravelControllerAstProjectionResponseJudgment<InvocationJudgment>;
}

/** The semantic AST ADT distinguishes invocation-only projection from integrated invocation/response projection. */
export type ControllerBodyAst<Semantic extends boolean = true> =
    Semantic extends true ? SemanticControllerBodyAst | IntegratedSemanticControllerBodyAst | BlockedSemanticControllerBodyAst | IntegratedBlockedSemanticControllerBodyAst : SyntaxOnlyControllerBodyAst;

export function createValidationRuleLiteral(value: string): ValidationRuleLiteralAst {
    return value as ValidationRuleLiteralAst;
}

export function createHttpErrorStatus(value: number): HttpErrorStatusAst {
    return relationGate(
        relationAll([Number.isInteger(value), value >= 400, value < 600]),
        () => value as HttpErrorStatusAst,
        () => { throw Error(`Invalid HTTP error status: ${value}`); },
    );
}
