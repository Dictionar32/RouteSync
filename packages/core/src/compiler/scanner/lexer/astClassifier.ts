/** Converts tokenized PHP expressions into structured Laravel scanner AST. */
import { PhpAstFactory } from './PhpAst';
import type { AstIdentifier, PhpArgument, PhpAstValue, PhpPropertyPath, TokenDescriptor, PhpBlock, PhpParameter, PhpClosureCapture, PhpStatement, PhpAccessMode, PhpBinaryOperator } from './PhpAst';
import { createAstIdentifier } from './phpAstTypes';
import { tokenizePhpSource } from './tokenizer';

export function classifyPhpBlock(tokens: readonly TokenDescriptor[]): PhpBlock {
    return parseBlock(tokens);
}

export function classifyAstValue(raw: string): PhpAstValue {
    const tokens = tokenizePhpSource(raw).filter(token => token.type !== 'EOF');
    return classifyAstTokens(tokens);
}

export function classifyAstTokens(tokens: readonly TokenDescriptor[]): PhpAstValue {
    if (tokens.length === 0) return PhpAstFactory.unsupported(tokens);
    const match = classifyMatch(tokens);
    if (match) return match;
    const closure = classifyClosure(tokens);
    if (closure) return closure;
    const arrow = classifyArrowFunction(tokens);
    if (arrow) return arrow;
    const first = tokens[0];
    const cast = classifyCast(tokens);
    if (cast) return cast;
    const parenthesized = classifyParenthesized(tokens);
    if (parenthesized) return parenthesized;
    if (tokens.length === 1) return classifySingle(first);
    const compound = classifyCompoundExpression(tokens);
    if (compound) return compound;
    if (first.value === '[' && tokens[tokens.length - 1]?.value === ']') return classifyInlineArray(tokens);
    const classReference = classifyClassReference(tokens);
    if (classReference) return classReference;
    if (first.value === 'new' && tokens[1]?.type === 'IDENTIFIER') {
        const className = createAstIdentifier(tokens[1].value);
        const open = indexOf(tokens, '(', 2);
        const close = lastIndexOf(tokens, ')');
        const args = open >= 0 && close > open ? parseArguments(tokens.slice(open + 1, close)) : [];
        const argument = args[0]?.value;
        return argument ? PhpAstFactory.resourceSingle(className, argument) : PhpAstFactory.unsupported(tokens);
    }
    const staticCall = classifyStaticCall(tokens);
    if (staticCall) return staticCall;
    const member = classifyMember(tokens);
    if (member) return member;
    const ternary = classifyTernary(tokens);
    if (ternary) return ternary;
    return PhpAstFactory.unsupported(tokens);
}

function classifyInlineArray(tokens: readonly TokenDescriptor[]): PhpAstValue {
    const entries: import('./phpAstTypes').PhpArrayEntry[] = [];
    let start = 1;
    let autoIndex = 0;
    let depth = 0;
    for (let index = 1; index <= tokens.length; index++) {
        const token = tokens[index];
        if (token && (token.value === '[' || token.value === '(' || token.value === '{')) depth++;
        if (token && (token.value === ']' || token.value === ')' || token.value === '}')) depth--;
        if (index === tokens.length - 1 || (token?.value === ',' && depth === 0)) {
            const part = tokens.slice(start, index === tokens.length - 1 ? index + 1 : index);
            const arrow = part.findIndex(item => item.type === 'ARROW');
            if (arrow > 0) {
                const keyTokens = part.slice(0, arrow);
                const valueTokens = part.slice(arrow + 1);
                const key = keyTokens.find(item => item.type === 'STRING' || item.type === 'IDENTIFIER' || item.type === 'NUMBER');
                if (!key || valueTokens.length === 0) return PhpAstFactory.unsupported(tokens);
                entries.push({ kind: 'keyed', key: key.value.startsWith('\'') || key.type === 'STRING' ? { kind: 'string', value: key.value } : key.type === 'NUMBER' ? { kind: 'integer', value: Number(key.value) } : { kind: 'expression', value: classifyAstTokens(keyTokens) }, value: classifyAstTokens(valueTokens) });
            } else if (part.length > 0) {
                entries.push({ kind: 'positional', value: classifyAstTokens(part) });
                autoIndex++;
            }
            start = index + 1;
        }
    }
    return PhpAstFactory.nestedArray(entries);
}

function classifyMatch(tokens: readonly TokenDescriptor[]): PhpAstValue | undefined {
    if (tokens[0]?.value !== 'match') return undefined;
    const openParen = indexOf(tokens, '(', 1);
    if (openParen < 0) return undefined;
    const closeParen = matchingClose(tokens, openParen);
    const openBrace = indexOf(tokens, '{', closeParen + 1);
    if (openBrace < 0 || tokens[tokens.length - 1]?.value !== '}') return undefined;
    const subject = classifyAstTokens(tokens.slice(openParen + 1, closeParen));
    const arms = parseMatchArms(tokens.slice(openBrace + 1, -1));
    return PhpAstFactory.matchExpression(subject, arms);
}

function parseMatchArms(tokens: readonly TokenDescriptor[]): readonly import('./phpAstTypes').PhpMatchArm[] {
    const parts = splitTopLevel(tokens, ',');
    return Object.freeze(parts.filter(part => part.length > 0).map(part => {
        const arrow = findTopLevelOperator(part, '=>');
        if (arrow < 0) return PhpAstFactory.matchConditional([], PhpAstFactory.unsupported(part));
        const left = part.slice(0, arrow);
        const value = classifyAstTokens(part.slice(arrow + 1));
        if (left.length === 1 && left[0].value === 'default') return PhpAstFactory.matchDefault(value);
        const conditions = splitTopLevel(left, ',').map(classifyAstTokens);
        return PhpAstFactory.matchConditional(conditions, value);
    }));
}

function splitTopLevel(tokens: readonly TokenDescriptor[], separator: string): readonly (readonly TokenDescriptor[])[] {
    const parts: (readonly TokenDescriptor[])[] = [];
    let start = 0;
    let depth = 0;
    for (let index = 0; index <= tokens.length; index++) {
        const token = tokens[index];
        if (token?.value === '(' || token?.value === '[' || token?.value === '{') depth++;
        if (token?.value === ')' || token?.value === ']' || token?.value === '}') depth--;
        if (index === tokens.length || (depth === 0 && token?.value === separator)) {
            parts.push(tokens.slice(start, index));
            start = index + 1;
        }
    }
    return Object.freeze(parts);
}

function classifyParenthesized(tokens: readonly TokenDescriptor[]): PhpAstValue | undefined {
    if (tokens[0]?.value !== '(' || tokens[tokens.length - 1]?.value !== ')') return undefined;
    if (matchingClose(tokens, 0) !== tokens.length - 1) return undefined;
    return classifyAstTokens(tokens.slice(1, -1));
}

function classifyCast(tokens: readonly TokenDescriptor[]): PhpAstValue | undefined {
    if (tokens[0]?.value !== '(' || tokens[2]?.value !== ')' || tokens[1]?.type !== 'IDENTIFIER') return undefined;
    const type = tokens[1].value;
    if (type === 'int') return PhpAstFactory.castExpression({ kind: 'int' }, classifyAstTokens(tokens.slice(3)));
    if (type === 'float') return PhpAstFactory.castExpression({ kind: 'float' }, classifyAstTokens(tokens.slice(3)));
    if (type === 'string') return PhpAstFactory.castExpression({ kind: 'string' }, classifyAstTokens(tokens.slice(3)));
    if (type === 'bool') return PhpAstFactory.castExpression({ kind: 'bool' }, classifyAstTokens(tokens.slice(3)));
    if (type === 'array') return PhpAstFactory.castExpression({ kind: 'array' }, classifyAstTokens(tokens.slice(3)));
    if (type === 'object') return PhpAstFactory.castExpression({ kind: 'object' }, classifyAstTokens(tokens.slice(3)));
    return undefined;
}

function classifyCompoundExpression(tokens: readonly TokenDescriptor[]): PhpAstValue | undefined {
    const coalesce = findTopLevelOperator(tokens, '??');
    if (coalesce >= 0) return PhpAstFactory.nullCoalesce(classifyAstTokens(tokens.slice(0, coalesce)), classifyAstTokens(tokens.slice(coalesce + 1)));
    const short = findTopLevelOperator(tokens, '?:');
    if (short >= 0) return PhpAstFactory.shortTernary(classifyAstTokens(tokens.slice(0, short)), classifyAstTokens(tokens.slice(short + 1)));
    const ternary = classifyTernary(tokens);
    if (ternary) return ternary;
    const access = classifyArrayAccess(tokens);
    if (access) return access;
    const call = classifyFunctionCall(tokens);
    if (call) return call;
    const binary = findBinaryOperator(tokens);
    if (binary) return PhpAstFactory.binaryExpression(binary.operator, classifyAstTokens(tokens.slice(0, binary.index)), classifyAstTokens(tokens.slice(binary.index + 1)));
    const unary = classifyUnary(tokens);
    if (unary) return unary;
    return undefined;
}

function classifyArrayAccess(tokens: readonly TokenDescriptor[]): PhpAstValue | undefined {
    const open = findOuterArrayAccess(tokens);
    if (open <= 0 || tokens[tokens.length - 1]?.value !== ']') return undefined;
    return PhpAstFactory.arrayAccess(classifyAstTokens(tokens.slice(0, open)), classifyAstTokens(tokens.slice(open + 1, -1)));
}

function findOuterArrayAccess(tokens: readonly TokenDescriptor[]): number {
    let depth = 0;
    for (let index = tokens.length - 1; index >= 0; index--) {
        const value = tokens[index].value;
        if (value === ']') depth++;
        if (value === '[') {
            depth--;
            if (depth === 0) return index;
        }
    }
    return -1;
}

function classifyFunctionCall(tokens: readonly TokenDescriptor[]): PhpAstValue | undefined {
    if (tokens[0]?.type !== 'IDENTIFIER' || tokens[1]?.value !== '(' || tokens[tokens.length - 1]?.value !== ')') return undefined;
    const args = parseArguments(tokens.slice(2, -1));
    return PhpAstFactory.functionCall(createAstIdentifier(tokens[0].value), args);
}

function classifyUnary(tokens: readonly TokenDescriptor[]): PhpAstValue | undefined {
    const operator = tokens[0]?.value;
    if (operator === '!') return PhpAstFactory.unaryExpression({ kind: 'not' }, classifyAstTokens(tokens.slice(1)));
    if (operator === '-') return PhpAstFactory.unaryExpression({ kind: 'negative' }, classifyAstTokens(tokens.slice(1)));
    if (operator === '+') return PhpAstFactory.unaryExpression({ kind: 'positive' }, classifyAstTokens(tokens.slice(1)));
    if (operator === '~') return PhpAstFactory.unaryExpression({ kind: 'bitwise_not' }, classifyAstTokens(tokens.slice(1)));
    return undefined;
}

function findTopLevelOperator(tokens: readonly TokenDescriptor[], value: string): number {
    let depth = 0;
    for (let index = 0; index < tokens.length; index++) {
        const token = tokens[index];
        if (token.value === '(' || token.value === '[' || token.value === '{') depth++;
        if (token.value === ')' || token.value === ']' || token.value === '}') depth--;
        if (depth === 0 && token.value === value) return index;
    }
    return -1;
}

function findBinaryOperator(tokens: readonly TokenDescriptor[]): { readonly operator: PhpBinaryOperator; readonly index: number } | undefined {
    const operators: readonly { readonly token: string; readonly operator: PhpBinaryOperator }[] = [
        { token: '===', operator: { kind: 'identical' } }, { token: '!==', operator: { kind: 'not_identical' } },
        { token: '>=', operator: { kind: 'greater_or_equal' } }, { token: '<=', operator: { kind: 'less_or_equal' } },
        { token: '==', operator: { kind: 'equal' } }, { token: '!=', operator: { kind: 'not_equal' } },
        { token: '>', operator: { kind: 'greater_than' } }, { token: '<', operator: { kind: 'less_than' } },
        { token: '+', operator: { kind: 'addition' } }, { token: '-', operator: { kind: 'subtraction' } },
        { token: '*', operator: { kind: 'multiplication' } }, { token: '/', operator: { kind: 'division' } },
        { token: '%', operator: { kind: 'modulo' } }, { token: '&&', operator: { kind: 'logical_and' } },
        { token: '||', operator: { kind: 'logical_or' } }, { token: '.', operator: { kind: 'concat' } }
    ];
    for (const entry of operators) {
        const index = findTopLevelOperator(tokens, entry.token);
        if (index > 0) return { operator: entry.operator, index };
    }
    return undefined;
}

function classifySingle(token: TokenDescriptor): PhpAstValue {
    switch (token.type) {
        case 'STRING': return PhpAstFactory.stringLiteral(token.value);
        case 'NUMBER': return PhpAstFactory.numberLiteral(token.value);
        case 'TRUE': return PhpAstFactory.booleanLiteral(true);
        case 'FALSE': return PhpAstFactory.booleanLiteral(false);
        case 'NULL': return PhpAstFactory.nullLiteral();
        case 'VARIABLE': return PhpAstFactory.variableReference(createAstIdentifier(token.value.slice(1)));
        default: return PhpAstFactory.unsupported([token]);
    }
}

function classifyStaticCall(tokens: readonly TokenDescriptor[]): PhpAstValue | undefined {
    if (tokens.length < 4 || tokens[0].type !== 'IDENTIFIER' || tokens[1].value !== '::') return undefined;
    const method = tokens[2];
    if (!method || method.type !== 'IDENTIFIER' || tokens[3]?.value !== '(') return undefined;
    const close = lastIndexOf(tokens, ')');
    const args = close > 3 ? parseArguments(tokens.slice(4, close)) : [];
    if (method.value === 'collection') return args[0] ? PhpAstFactory.resourceCollection(createAstIdentifier(tokens[0].value), args[0].value) : PhpAstFactory.unsupported(tokens);
    if (method.value === 'make') return args[0] ? PhpAstFactory.resourceSingle(createAstIdentifier(tokens[0].value), args[0].value) : PhpAstFactory.unsupported(tokens);
    return PhpAstFactory.staticCall(createAstIdentifier(tokens[0].value), createAstIdentifier(method.value), args);
}

function classifyMember(tokens: readonly TokenDescriptor[]): PhpAstValue | undefined {
    const firstOperator = tokens.findIndex(token => token.value === '->' || token.value === '?->');
    if (firstOperator <= 0) return undefined;
    const receiver = classifyAstTokens(tokens.slice(0, firstOperator));
    if (receiver.kind === 'unsupported') return undefined;
    return parseMemberSuffix(receiver, tokens, firstOperator);
}

function parseMemberSuffix(receiver: PhpAstValue, tokens: readonly TokenDescriptor[], operatorIndex: number): PhpAstValue | undefined {
    const operator = tokens[operatorIndex];
    const property = tokens[operatorIndex + 1];
    if (!property || property.type !== 'IDENTIFIER') return undefined;
    const nullsafe = operator.value === '?->';
    if (tokens[operatorIndex + 2]?.value === '(') {
        const open = operatorIndex + 2;
        const close = matchingClose(tokens, open);
        const args = parseArguments(tokens.slice(open + 1, close));
        const current = PhpAstFactory.methodChain(toPropertyPath(receiver, property.value), receiver, createAstIdentifier(property.value), args, nullsafe ? { kind: 'nullsafe' } : { kind: 'direct' });
        return parseNextMember(current, tokens, close + 1);
    }
    const current = PhpAstFactory.propertyAccess(toPropertyPath(receiver, property.value), receiver, createAstIdentifier(property.value), nullsafe ? { kind: 'nullsafe' } : { kind: 'direct' });
    return parseNextMember(current, tokens, operatorIndex + 2);
}

function parseNextMember(receiver: PhpAstValue, tokens: readonly TokenDescriptor[], start: number): PhpAstValue | undefined {
    if (start >= tokens.length) return receiver;
    const operator = tokens[start];
    if (operator.value !== '->' && operator.value !== '?->') return undefined;
    return parseMemberSuffix(receiver, tokens, start);
}

function toPropertyPath(receiver: PhpAstValue, property: string): PhpPropertyPath {
    if (receiver.kind === 'variable_reference') return { root: receiver.name, steps: Object.freeze([]) };
    if (receiver.kind === 'property_access' || receiver.kind === 'method_chain') return { root: receiver.target.root, steps: Object.freeze([...receiver.target.steps, receiver.property]) };
    return { root: createAstIdentifier(property), steps: Object.freeze([]) };
}

function classifyClosure(tokens: readonly TokenDescriptor[]): PhpAstValue | undefined {
    if (tokens[0]?.value !== 'function') return undefined;
    const open = indexOf(tokens, '(', 1);
    if (open < 0) return undefined;
    const close = matchingClose(tokens, open);
    const useIndex = tokens.findIndex((token, index) => index > close && token.value === 'use');
    const bodyOpen = indexOf(tokens, '{', useIndex >= 0 ? useIndex : close + 1);
    const params = parseParameters(tokens.slice(open + 1, close));
    const captures = useIndex >= 0 ? parseCaptures(tokens, useIndex) : [];
    if (bodyOpen < 0) return PhpAstFactory.unsupported(tokens);
    const bodyClose = matchingBrace(tokens, bodyOpen);
    return PhpAstFactory.closure(params, captures, parseBlock(tokens.slice(bodyOpen + 1, bodyClose)));
}

function classifyArrowFunction(tokens: readonly TokenDescriptor[]): PhpAstValue | undefined {
    const arrow = tokens.findIndex(token => token.type === 'ARROW');
    if (arrow < 1) return undefined;
    const open = tokens.findIndex((token, index) => index < arrow && token.value === '(');
    if (open < 0) return undefined;
    const close = matchingClose(tokens, open);
    if (close >= arrow) return undefined;
    return PhpAstFactory.arrowFunction(parseParameters(tokens.slice(open + 1, close)), classifyAstTokens(tokens.slice(arrow + 1)));
}

function parseParameters(tokens: readonly TokenDescriptor[]): readonly PhpParameter[] {
    if (tokens.length === 0) return [];
    return tokens.filter(token => token.type === 'VARIABLE').map(token => ({ variable: createAstIdentifier(token.value.slice(1)) }));
}

function parseCaptures(tokens: readonly TokenDescriptor[], useIndex: number): readonly PhpClosureCapture[] {
    const open = indexOf(tokens, '(', useIndex + 1);
    if (open < 0) return [];
    const close = matchingClose(tokens, open);
    const result: PhpClosureCapture[] = [];
    let byReference = false;
    for (const token of tokens.slice(open + 1, close)) {
        if (token.value === '&') { byReference = true; continue; }
        if (token.type === 'VARIABLE') {
            result.push({ kind: byReference ? 'by_reference' : 'by_value', variable: createAstIdentifier(token.value.slice(1)) });
            byReference = false;
        }
    }
    return result;
}

function parseBlock(tokens: readonly TokenDescriptor[]): PhpBlock {
    return Object.freeze({ kind: 'block', statements: Object.freeze(parseStatements(tokens)) });
}

function parseStatements(tokens: readonly TokenDescriptor[]): PhpStatement[] {
    const result: PhpStatement[] = [];
    let index = 0;
    while (index < tokens.length) {
        if (tokens[index].type === 'EOF' || tokens[index].value === ';') { index++; continue; }
        const parsed = parseStructuredStatement(tokens, index);
        if (parsed) { result.push(parsed.statement); index = parsed.nextIndex; continue; }
        const end = findStatementEnd(tokens, index);
        const part = tokens.slice(index, end);
        if (part.length > 0) result.push(parseSimpleStatement(part));
        index = end < tokens.length ? end + 1 : end;
    }
    return result;
}

function parseStructuredStatement(tokens: readonly TokenDescriptor[], start: number): { readonly statement: PhpStatement; readonly nextIndex: number } | undefined {
    const keyword = tokens[start]?.value;
    if (keyword === 'if') return parseIfStatement(tokens, start);
    if (keyword === 'foreach') return parseForeachStatement(tokens, start);
    if (keyword === 'for') return parseForStatement(tokens, start);
    if (keyword === 'try') return parseTryStatement(tokens, start);
    if (keyword === 'throw') {
        const end = findStatementEnd(tokens, start);
        return { statement: PhpAstFactory.throwStatement(classifyAstTokens(tokens.slice(start + 1, end))), nextIndex: end < tokens.length ? end + 1 : end };
    }
    return undefined;
}

function parseSimpleStatement(part: readonly TokenDescriptor[]): PhpStatement {
    if (part[0]?.value === 'return') {
        if (part.length === 1) return { kind: 'return_void' };
        return { kind: 'return_with_value', expression: classifyAstTokens(part.slice(1)) };
    }
    const assignment = classifyAssignment(part);
    return assignment ?? { kind: 'expression_statement', expression: classifyAstTokens(part) };
}

function findStatementEnd(tokens: readonly TokenDescriptor[], start: number): number {
    let paren = 0;
    let bracket = 0;
    let brace = 0;
    for (let index = start; index < tokens.length; index++) {
        const value = tokens[index].value;
        if (value === '(') paren++;
        else if (value === ')') paren--;
        else if (value === '[') bracket++;
        else if (value === ']') bracket--;
        else if (value === '{') brace++;
        else if (value === '}') brace--;
        if (value === ';' && paren === 0 && bracket === 0 && brace === 0) return index;
    }
    return tokens.length;
}

function parseIfStatement(tokens: readonly TokenDescriptor[], start: number): { readonly statement: PhpStatement; readonly nextIndex: number } | undefined {
    const open = indexOf(tokens, '(', start + 1);
    if (open < 0) return undefined;
    const close = matchingClose(tokens, open);
    const bodyOpen = indexOf(tokens, '{', close + 1);
    if (bodyOpen < 0) return undefined;
    const bodyClose = matchingBrace(tokens, bodyOpen);
    if (bodyClose >= tokens.length) return undefined;
    const condition = classifyAstTokens(tokens.slice(open + 1, close));
    const thenBlock = parseBlock(tokens.slice(bodyOpen + 1, bodyClose));
    let next = bodyClose + 1;
    if (tokens[next]?.value !== 'else') return { statement: PhpAstFactory.ifStatement(condition, thenBlock, { kind: 'none' }), nextIndex: next };
    if (tokens[next + 1]?.value === 'if') {
        const nested = parseIfStatement(tokens, next + 1);
        if (nested) return { statement: PhpAstFactory.ifStatement(condition, thenBlock, { kind: 'else_if', statement: nested.statement as Extract<PhpStatement, { kind: 'if_statement' }> }), nextIndex: nested.nextIndex };
    }
    const elseOpen = tokens[next + 1]?.value === '{' ? next + 1 : -1;
    if (elseOpen < 0) return undefined;
    const elseClose = matchingBrace(tokens, elseOpen);
    return { statement: PhpAstFactory.ifStatement(condition, thenBlock, { kind: 'else_block', block: parseBlock(tokens.slice(elseOpen + 1, elseClose)) }), nextIndex: elseClose + 1 };
}

function parseForeachStatement(tokens: readonly TokenDescriptor[], start: number): { readonly statement: PhpStatement; readonly nextIndex: number } | undefined {
    const open = indexOf(tokens, '(', start + 1);
    if (open < 0) return undefined;
    const close = matchingClose(tokens, open);
    const asIndex = findTopLevelOperator(tokens.slice(open + 1, close), 'as');
    if (asIndex < 0) return undefined;
    const inner = tokens.slice(open + 1, close);
    const iterable = classifyAstTokens(inner.slice(0, asIndex));
    const targetTokens = inner.slice(asIndex + 1);
    const arrow = targetTokens.findIndex(token => token.type === 'ARROW');
    const variableTokens = arrow >= 0 ? targetTokens.slice(arrow + 1) : targetTokens;
    const variables = variableTokens.filter(token => token.type === 'VARIABLE');
    if (variables.length === 0) return undefined;
    const target = arrow >= 0 && variables.length >= 2
        ? { kind: 'key_value' as const, key: createAstIdentifier(variables[0].value.slice(1)), value: createAstIdentifier(variables[1].value.slice(1)) }
        : { kind: 'value' as const, variable: createAstIdentifier(variables[0].value.slice(1)) };
    const bodyOpen = indexOf(tokens, '{', close + 1);
    if (bodyOpen < 0) return undefined;
    const bodyClose = matchingBrace(tokens, bodyOpen);
    return { statement: PhpAstFactory.foreachStatement(iterable, target, parseBlock(tokens.slice(bodyOpen + 1, bodyClose))), nextIndex: bodyClose + 1 };
}

function parseForStatement(tokens: readonly TokenDescriptor[], start: number): { readonly statement: PhpStatement; readonly nextIndex: number } | undefined {
    const open = indexOf(tokens, '(', start + 1);
    if (open < 0) return undefined;
    const close = matchingClose(tokens, open);
    const clauses = splitTopLevel(tokens.slice(open + 1, close), ';');
    if (clauses.length !== 3) return undefined;
    const bodyOpen = indexOf(tokens, '{', close + 1);
    if (bodyOpen < 0) return undefined;
    const bodyClose = matchingBrace(tokens, bodyOpen);
    return { statement: PhpAstFactory.forStatement(toForClause(clauses[0]), toForClause(clauses[1]), toForClause(clauses[2]), parseBlock(tokens.slice(bodyOpen + 1, bodyClose))), nextIndex: bodyClose + 1 };
}

function toForClause(tokens: readonly TokenDescriptor[]): import('./phpAstTypes').PhpForClause {
    if (tokens.length === 0) return { kind: 'empty' };
    const assignment = classifyAssignment(tokens);
    if (assignment?.kind === 'assignment') return { kind: 'assignment', target: assignment.target, value: assignment.value };
    return { kind: 'expression', value: classifyAstTokens(tokens) };
}

function parseTryStatement(tokens: readonly TokenDescriptor[], start: number): { readonly statement: PhpStatement; readonly nextIndex: number } | undefined {
    const bodyOpen = indexOf(tokens, '{', start + 1);
    if (bodyOpen < 0) return undefined;
    const bodyClose = matchingBrace(tokens, bodyOpen);
    let index = bodyClose + 1;
    const catches: import('./phpAstTypes').PhpCatchClause[] = [];
    while (tokens[index]?.value === 'catch') {
        const open = indexOf(tokens, '(', index + 1);
        if (open < 0) return undefined;
        const close = matchingClose(tokens, open);
        const vars = tokens.slice(open + 1, close).filter(token => token.type === 'IDENTIFIER' || token.type === 'VARIABLE');
        const exceptionType = vars.find(token => token.type === 'IDENTIFIER');
        const variable = vars.find(token => token.type === 'VARIABLE');
        const catchOpen = indexOf(tokens, '{', close + 1);
        if (!exceptionType || !variable || catchOpen < 0) return undefined;
        const catchClose = matchingBrace(tokens, catchOpen);
        catches.push({ exceptionType: createAstIdentifier(exceptionType.value), variable: createAstIdentifier(variable.value.slice(1)), body: parseBlock(tokens.slice(catchOpen + 1, catchClose)) });
        index = catchClose + 1;
    }
    let finallyBlock: import('./phpAstTypes').PhpFinallyClause = { kind: 'absent' };
    if (tokens[index]?.value === 'finally') {
        const open = indexOf(tokens, '{', index + 1);
        if (open < 0) return undefined;
        const close = matchingBrace(tokens, open);
        finallyBlock = { kind: 'present', block: parseBlock(tokens.slice(open + 1, close)) };
        index = close + 1;
    }
    return { statement: PhpAstFactory.tryStatement(parseBlock(tokens.slice(bodyOpen + 1, bodyClose)), catches, finallyBlock), nextIndex: index };
}

function classifyAssignment(tokens: readonly TokenDescriptor[]): PhpStatement | undefined {
    const index = findTopLevelOperator(tokens, '=');
    if (index <= 0 || index >= tokens.length - 1) return undefined;
    const target = classifyAssignmentTarget(tokens.slice(0, index));
    if (!target) return undefined;
    return PhpAstFactory.assignment(target, classifyAstTokens(tokens.slice(index + 1)));
}

function classifyAssignmentTarget(tokens: readonly TokenDescriptor[]): import('./phpAstTypes').PhpAssignmentTarget | undefined {
    if (tokens.length === 1 && tokens[0].type === 'VARIABLE') return { kind: 'variable', name: createAstIdentifier(tokens[0].value.slice(1)) };
    const access = classifyArrayAccess(tokens);
    if (access?.kind === 'array_access') return { kind: 'array_element', target: access.target, index: access.index };
    const member = classifyMember(tokens);
    if (member?.kind === 'property_access') return { kind: 'property', target: member.target, property: member.property };
    return undefined;
}

function parseArguments(tokens: readonly TokenDescriptor[]): readonly PhpArgument[] {
    if (tokens.length === 0) return [];
    const result: PhpArgument[] = [];
    let start = 0;
    let depth = 0;
    for (let index = 0; index <= tokens.length; index++) {
        const token = tokens[index];
        if (token && (token.value === '(' || token.value === '[' || token.value === '{')) depth++;
        if (token && (token.value === ')' || token.value === ']' || token.value === '}')) depth--;
        if (index === tokens.length || (token?.value === ',' && depth === 0)) {
            const part = tokens.slice(start, index);
            if (part.length > 0) result.push(parseArgument(part));
            start = index + 1;
        }
    }
    return Object.freeze(result);
}

function parseArgument(tokens: readonly TokenDescriptor[]): PhpArgument {
    if (tokens[0]?.value === '...') return { kind: 'unpacked', value: classifyAstTokens(tokens.slice(1)) };
    const arrow = tokens.findIndex(token => token.type === 'ARROW');
    if (arrow > 0 && tokens[0].type === 'IDENTIFIER') return { kind: 'named', name: createAstIdentifier(tokens[0].value), value: classifyAstTokens(tokens.slice(arrow + 1)) };
    return { kind: 'positional', value: classifyAstTokens(tokens) };
}

function parseMemberPath(tokens: readonly TokenDescriptor[]): PhpPropertyPath {
    const parts: AstIdentifier[] = [];
    for (const token of tokens) {
        if (token.type === 'VARIABLE') parts.push(createAstIdentifier(token.value.slice(1)));
        if (token.type === 'IDENTIFIER' && token.value !== 'this') parts.push(createAstIdentifier(token.value));
    }
    const root = parts[0];
    if (!root) throw new Error('PHP member path root is missing');
    return PhpAstFactory.propertyPath(root, parts.slice(1));
}

function classifyClassReference(tokens: readonly TokenDescriptor[]): PhpAstValue | undefined {
    if (tokens.length === 3 && tokens[0].type === 'IDENTIFIER' && tokens[1].value === '::' && tokens[2].value === 'class') return PhpAstFactory.classReference(createAstIdentifier(tokens[0].value));
    return undefined;
}
function matchingClose(tokens: readonly TokenDescriptor[], openIndex: number): number { let depth = 0; for (let index = openIndex; index < tokens.length; index++) { if (tokens[index].value === '(') depth++; else if (tokens[index].value === ')') { depth--; if (depth === 0) return index; } } return tokens.length; }
function matchingBrace(tokens: readonly TokenDescriptor[], openIndex: number): number { let depth = 0; for (let index = openIndex; index < tokens.length; index++) { if (tokens[index].value === '{') depth++; else if (tokens[index].value === '}') { depth--; if (depth === 0) return index; } } return tokens.length; }
function classifyTernary(tokens: readonly TokenDescriptor[]): PhpAstValue | undefined { const question = tokens.findIndex(token => token.value === '?'); if (question < 1) return undefined; const colon = tokens.findIndex((token, index) => index > question && token.value === ':'); if (colon < 0) return undefined; return PhpAstFactory.ternaryExpression(classifyAstTokens(tokens.slice(0, question)), classifyAstTokens(tokens.slice(question + 1, colon)), classifyAstTokens(tokens.slice(colon + 1))); }
function indexOf(tokens: readonly TokenDescriptor[], value: string, start: number): number { for (let index = start; index < tokens.length; index++) if (tokens[index].value === value) return index; return -1; }
function lastIndexOf(tokens: readonly TokenDescriptor[], value: string): number { for (let index = tokens.length - 1; index >= 0; index--) if (tokens[index].value === value) return index; return -1; }
