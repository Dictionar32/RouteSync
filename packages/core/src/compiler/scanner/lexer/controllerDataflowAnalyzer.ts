import type { AstIdentifier, PhpAstValue, PhpBlock, PhpStatement } from './phpAstTypes';
import type { ControllerDataflowAst, ControllerVariableDefinition, ControllerVariableReference, ControllerDefinitionAvailability } from './controllerBodyAstTypes';
export interface ControllerDataflowReference extends ControllerVariableReference {
    readonly availability: ControllerDefinitionAvailability;
}
interface FlowState { readonly definite: ReadonlyMap<AstIdentifier, number>; readonly path: readonly number[]; }
export function analyzeControllerDataflow(block: PhpBlock, parameters: readonly AstIdentifier[]): ControllerDataflowAst {
    const definitions: ControllerVariableDefinition[] = [];
    const references: ControllerDataflowReference[] = [];
    const parameterSet = new Set(parameters);
    let statementIndex = 0;
    const initial: FlowState = { definite: new Map([...parameterSet].map(name => [name, -1])), path: [] };
    walkBlock(block, initial, definitions, references, () => statementIndex++);
    return Object.freeze({ definitions: Object.freeze(definitions), references: Object.freeze(references) });
}
function walkBlock(block: PhpBlock, state: FlowState, defs: ControllerVariableDefinition[], refs: ControllerDataflowReference[], nextIndex: () => number): FlowState {
    let current = state;
    for (const statement of block.statements) current = walkStatement(statement, current, defs, refs, nextIndex);
    return current;
}
function walkStatement(statement: PhpStatement, state: FlowState, defs: ControllerVariableDefinition[], refs: ControllerDataflowReference[], nextIndex: () => number): FlowState {
    const index = nextIndex();
    if (statement.kind === 'assignment') {
        collectValue(statement.value, state, index, refs);
        if (statement.target.kind === 'variable') {
            defs.push({ name: statement.target.name, statementIndex: index, origin: { kind: 'assignment' }, value: statement.value, availability: availability(state) });
            return withDefinite(state, statement.target.name, index);
        }
        return state;
    }
    if (statement.kind === 'if_statement') return walkIf(statement, state, defs, refs, nextIndex, index);
    if (statement.kind === 'foreach_statement') return walkLoop(statement, state, defs, refs, nextIndex, index);
    if (statement.kind === 'for_statement') return walkFor(statement, state, defs, refs, nextIndex, index);
    if (statement.kind === 'try_statement') return walkTry(statement, state, defs, refs, nextIndex, index);
    collectStatement(statement, state, index, refs);
    return state;
}
function walkIf(s: Extract<PhpStatement, { kind: 'if_statement' }>, state: FlowState, defs: ControllerVariableDefinition[], refs: ControllerDataflowReference[], nextIndex: () => number, index: number): FlowState {
    collectValue(s.condition, state, index, refs);
    const branch = { ...state, path: [...state.path, index] };
    const yes = walkBlock(s.thenBlock, branch, defs, refs, nextIndex);
    const no = s.alternative.kind === 'else_block' ? walkBlock(s.alternative.block, branch, defs, refs, nextIndex) : s.alternative.kind === 'else_if' ? walkStatement(s.alternative.statement, branch, defs, refs, nextIndex) : state;
    return intersect(yes.definite, no.definite, state.path);
}
function walkLoop(s: Extract<PhpStatement, { kind: 'foreach_statement' }>, state: FlowState, defs: ControllerVariableDefinition[], refs: ControllerDataflowReference[], nextIndex: () => number, index: number): FlowState {
    collectValue(s.iterable, state, index, refs);
    const branch = { ...state, path: [...state.path, index] };
    if (s.target.kind === 'value') defs.push({ name: s.target.variable, statementIndex: index, origin: { kind: 'foreach', statementIndex: index }, value: s.iterable, availability: { kind: 'loop_conditional', branchPath: branch.path } });
    if (s.target.kind === 'key_value') {
        defs.push({ name: s.target.key, statementIndex: index, origin: { kind: 'foreach', statementIndex: index }, value: s.iterable, availability: { kind: 'loop_conditional', branchPath: branch.path } });
        defs.push({ name: s.target.value, statementIndex: index, origin: { kind: 'foreach', statementIndex: index }, value: s.iterable, availability: { kind: 'loop_conditional', branchPath: branch.path } });
    }
    const body = walkBlock(s.body, branch, defs, refs, nextIndex);
    return stateWithOnlyPrevious(state, body.definite);
}
function walkFor(s: Extract<PhpStatement, { kind: 'for_statement' }>, state: FlowState, defs: ControllerVariableDefinition[], refs: ControllerDataflowReference[], nextIndex: () => number, index: number): FlowState {
    collectClause(s.initializer, state, index, refs);
    collectClause(s.condition, state, index, refs);
    const branch = { ...state, path: [...state.path, index] };
    walkBlock(s.body, branch, defs, refs, nextIndex);
    collectClause(s.update, state, index, refs);
    return state;
}
function walkTry(s: Extract<PhpStatement, { kind: 'try_statement' }>, state: FlowState, defs: ControllerVariableDefinition[], refs: ControllerDataflowReference[], nextIndex: () => number, index: number): FlowState {
    const body = walkBlock(s.body, { ...state, path: [...state.path, index] }, defs, refs, nextIndex);
    const paths = s.catches.map(c => {
        const catchState = { ...state, path: [...state.path, index] };
        defs.push({ name: c.variable, statementIndex: index, origin: { kind: 'catch', statementIndex: index }, value: { kind: 'unsupported', reason: 'dynamic_construct', tokens: [] }, availability: { kind: 'catch_conditional', branchPath: catchState.path } });
        return walkBlock(c.body, withDefinite(catchState, c.variable, index), defs, refs, nextIndex);
    });
    const merged = paths.reduce<ReadonlyMap<AstIdentifier, number>>((set, item) => intersect(set, item.definite, state.path).definite, body.definite);
    return s.finallyBlock.kind === 'present' ? walkBlock(s.finallyBlock.block, state, defs, refs, nextIndex) : stateWithOnlyPrevious(state, merged);
}
function collectStatement(s: PhpStatement, state: FlowState, index: number, refs: ControllerDataflowReference[]): void {
    if (s.kind === 'expression_statement' || s.kind === 'return_with_value' || s.kind === 'throw_statement') collectValue(s.expression, state, index, refs);
}
function collectClause(c: { readonly kind: string; readonly value?: PhpAstValue }, state: FlowState, index: number, refs: ControllerDataflowReference[]): void { if (c.kind === 'expression' && c.value) collectValue(c.value, state, index, refs); }
function collectValue(v: PhpAstValue, state: FlowState, index: number, refs: ControllerDataflowReference[]): void {
    if (v.kind === 'variable_reference') refs.push({ name: v.name, statementIndex: index, origin: state.definite.has(v.name) ? { kind: 'local_assignment', statementIndex: state.definite.get(v.name) as number } : { kind: 'external' }, availability: availability(state) });
    if (v.kind === 'array_access') { collectValue(v.target, state, index, refs); collectValue(v.index, state, index, refs); }
    if (v.kind === 'property_access') collectValue(v.receiver, state, index, refs);
    if (v.kind === 'method_chain') { collectValue(v.receiver, state, index, refs); v.arguments.forEach(a => collectValue(a.value, state, index, refs)); }
    if (v.kind === 'function_call' || v.kind === 'static_call') v.arguments.forEach(a => collectValue(a.value, state, index, refs));
    if (v.kind === 'resource_single' || v.kind === 'resource_collection') collectValue(v.argument, state, index, refs);
    if (v.kind === 'ternary_expression') { collectValue(v.condition, state, index, refs); collectValue(v.trueBranch, state, index, refs); collectValue(v.falseBranch, state, index, refs); }
    if (v.kind === 'short_ternary') { collectValue(v.condition, state, index, refs); collectValue(v.falseBranch, state, index, refs); }
    if (v.kind === 'null_coalesce') { collectValue(v.left, state, index, refs); collectValue(v.right, state, index, refs); }
    if (v.kind === 'binary_expression') { collectValue(v.left, state, index, refs); collectValue(v.right, state, index, refs); }
    if (v.kind === 'unary_expression' || v.kind === 'cast_expression') collectValue(v.operand, state, index, refs);
    if (v.kind === 'nested_array') v.entries.forEach(e => collectValue(e.value, state, index, refs));
}
function withDefinite(state: FlowState, name: AstIdentifier, statementIndex = -1): FlowState { return { ...state, definite: new Map([...state.definite, [name, statementIndex]]) }; }
function availability(state: FlowState): ControllerDefinitionAvailability { return state.path.length === 0 ? { kind: 'definite' } : { kind: 'branch_conditional', branchPath: state.path }; }
function intersect(a: ReadonlyMap<AstIdentifier, number>, b: ReadonlyMap<AstIdentifier, number>, path: readonly number[]): FlowState { return { definite: new Map([...a].filter(([name]) => b.has(name))), path }; }
function stateWithOnlyPrevious(state: FlowState, candidates: ReadonlyMap<AstIdentifier, number>): FlowState { return { ...state, definite: new Map([...state.definite].filter(([name]) => candidates.has(name))) }; }
