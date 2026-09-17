/** Converts tokenized PHP expressions into structured Laravel scanner AST. */
import { PhpAstFactory } from './PhpAst';
import type { AstIdentifier, PhpArgument, PhpAstValue, PhpPropertyPath, TokenDescriptor, PhpBlock, PhpParameter, PhpClosureCapture } from './PhpAst';
import { createAstIdentifier } from './phpAstTypes';
import { tokenizePhpSource } from './tokenizer';

export function classifyAstValue(raw: string): PhpAstValue {
    const tokens = tokenizePhpSource(raw).filter(token => token.type !== 'EOF');
    return classifyAstTokens(tokens);
}

export function classifyAstTokens(tokens: readonly TokenDescriptor[]): PhpAstValue {
    if (tokens.length === 0) return PhpAstFactory.unsupported(tokens);
    const closure = classifyClosure(tokens);
    if (closure) return closure;
    const arrow = classifyArrowFunction(tokens);
    if (arrow) return arrow;
    const first = tokens[0];
    if (tokens.length === 1) return classifySingle(first);
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
                entries.push({ key: createAstIdentifier(key.value), keyExpression: classifyAstTokens(keyTokens), value: classifyAstTokens(valueTokens) });
            } else if (part.length > 0) {
                entries.push({ key: createAstIdentifier(String(autoIndex++)), value: classifyAstTokens(part) });
            }
            start = index + 1;
        }
    }
    return PhpAstFactory.nestedArray(entries);
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
        const current = PhpAstFactory.methodChain(toPropertyPath(receiver, property.value), receiver, createAstIdentifier(property.value), args, nullsafe);
        return parseNextMember(current, tokens, close + 1);
    }
    const current = PhpAstFactory.propertyAccess(toPropertyPath(receiver, property.value), receiver, createAstIdentifier(property.value), nullsafe);
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
    const statements: PhpBlock['statements'][number][] = [];
    let start = 0;
    for (let index = 0; index <= tokens.length; index++) {
        if (index === tokens.length || tokens[index]?.value === ';') {
            const part = tokens.slice(start, index);
            if (part.length === 0) { start = index + 1; continue; }
            if (part[0].value === 'return') {
                statements.push({ kind: 'return_statement', expression: part.length === 1 ? undefined : classifyAstTokens(part.slice(1)) });
            } else {
                statements.push({ kind: 'expression_statement', expression: classifyAstTokens(part) });
            }
            start = index + 1;
        }
    }
    return Object.freeze({ kind: 'block', statements: Object.freeze(statements) });
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
