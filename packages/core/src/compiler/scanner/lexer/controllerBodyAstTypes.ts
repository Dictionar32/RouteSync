/** Typed AST for controller-body facts consumed by semantic resolution. */
import type { AstIdentifier, TokenDescriptor, PhpAstValue, PhpBlock, PhpStatement } from './phpAstTypes';
import type { ControllerVariableSemantic, ControllerSemanticVariableFlow } from '../../../types/upstream/controller';
import type { SemanticKnowledgeDataFlow } from './routeAst/semanticKnowledgeDataFlowRelations';
import { relationAll, relationGate } from '../../../semantic/foundation/semanticRelations';

export type ValidationRuleLiteralAst = string & { readonly __validationRuleAst: unique symbol };

export interface InlineValidationAst {
    readonly field: AstIdentifier;
    readonly rules: readonly ValidationRuleLiteralAst[];
    readonly source: TokenDescriptor;
}

export type HttpErrorStatusAst = number & { readonly __httpErrorStatusAst: unique symbol };

export interface ControllerErrorAst {
    readonly status: HttpErrorStatusAst;
    readonly source: TokenDescriptor;
}

export interface ControllerDataflowAst {
    /** Canonical upstream semantic variable flow; PHP AST remains evidence only. */
    readonly semanticVariables: ControllerSemanticVariableFlow;
    readonly semanticKnowledgeDataFlow: SemanticKnowledgeDataFlow;
}

export interface ControllerBodyAst {
    readonly statements: readonly PhpStatement[];
    readonly validations: readonly InlineValidationAst[];
    readonly errors: readonly ControllerErrorAst[];
    readonly dataflow: ControllerDataflowAst;
}

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
