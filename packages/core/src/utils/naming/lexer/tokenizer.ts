/**
 * Declarative lexical relation evaluator.
 *
 * Characters are evidence. State transitions are data, not imperative control
 * flow. The transition relation emits an optional completed word and the next
 * lexical state; recursive relation closure consumes the input stream.
 */
import { CharKind, LexerState, classifyChar } from './types';

type Step = Readonly<{
    readonly state: LexerState;
    readonly kind: CharKind;
    readonly consume: (buffer: string, char: string) => Readonly<{ readonly buffer: string; readonly emitted: readonly string[]; readonly state: LexerState }>;
}>;

type StepResult = ReturnType<Step['consume']>;

const emit = (buffer: string, state: LexerState, next: string): StepResult => {
    if (buffer.length > 0) {
        return Object.freeze({ buffer: next, emitted: Object.freeze([buffer]), state });
    }
    return Object.freeze({ buffer: next, emitted: Object.freeze([]), state });
};

const append = (buffer: string, state: LexerState, char: string): StepResult =>
    Object.freeze({ buffer: `${buffer}${char}`, emitted: Object.freeze([]), state });

const START_DELIMITER: Step = { state: LexerState.START, kind: CharKind.DELIM, consume: buffer => Object.freeze({ buffer, emitted: Object.freeze([]), state: LexerState.START }) };

const START: Step[] = [
    { state: LexerState.START, kind: CharKind.LOWER, consume: (_, char) => append('', LexerState.LOWERCASE_WORD, char) },
    { state: LexerState.START, kind: CharKind.UPPER, consume: (_, char) => append('', LexerState.UPPERCASE_WORD, char) },
    { state: LexerState.START, kind: CharKind.DIGIT, consume: (_, char) => append('', LexerState.LOWERCASE_WORD, char) },
    START_DELIMITER,
];

const LOWER: Step[] = [
    { state: LexerState.LOWERCASE_WORD, kind: CharKind.LOWER, consume: (buffer, char) => append(buffer, LexerState.LOWERCASE_WORD, char) },
    { state: LexerState.LOWERCASE_WORD, kind: CharKind.DIGIT, consume: (buffer, char) => append(buffer, LexerState.LOWERCASE_WORD, char) },
    { state: LexerState.LOWERCASE_WORD, kind: CharKind.UPPER, consume: (buffer, char) => emit(buffer, LexerState.UPPERCASE_WORD, char) },
    { state: LexerState.LOWERCASE_WORD, kind: CharKind.DELIM, consume: buffer => emit(buffer, LexerState.START, '') },
];

const UPPER: Step[] = [
    { state: LexerState.UPPERCASE_WORD, kind: CharKind.LOWER, consume: (buffer, char) => append(buffer, LexerState.LOWERCASE_WORD, char) },
    { state: LexerState.UPPERCASE_WORD, kind: CharKind.DIGIT, consume: (buffer, char) => append(buffer, LexerState.LOWERCASE_WORD, char) },
    { state: LexerState.UPPERCASE_WORD, kind: CharKind.UPPER, consume: (buffer, char) => append(buffer, LexerState.ACRONYM, char) },
    { state: LexerState.UPPERCASE_WORD, kind: CharKind.DELIM, consume: buffer => emit(buffer, LexerState.START, '') },
];

const ACRONYM: Step[] = [
    { state: LexerState.ACRONYM, kind: CharKind.UPPER, consume: (buffer, char) => append(buffer, LexerState.ACRONYM, char) },
    { state: LexerState.ACRONYM, kind: CharKind.DIGIT, consume: (buffer, char) => append(buffer, LexerState.ACRONYM, char) },
    { state: LexerState.ACRONYM, kind: CharKind.LOWER, consume: (buffer, char) => {
        const lastUpper = buffer.slice(-1);
        return Object.freeze({ buffer: `${lastUpper}${char}`, emitted: Object.freeze([buffer.slice(0, -1)]), state: LexerState.LOWERCASE_WORD });
    } },
    { state: LexerState.ACRONYM, kind: CharKind.DELIM, consume: buffer => emit(buffer, LexerState.START, '') },
];

const STEPS = Object.freeze([...START, ...LOWER, ...UPPER, ...ACRONYM]);
const key = (state: LexerState, kind: CharKind): string => `${state}:${kind}`;
const stepAt = (state: LexerState, kind: CharKind): Step => {
    const selected = STEPS.find(step => Object.is(key(step.state, step.kind), key(state, kind)));
    if (selected === undefined) {
        return START_DELIMITER;
    }
    return selected;
};

const close = (buffer: string): readonly string[] =>
    buffer.length > 0 ? Object.freeze([buffer]) : Object.freeze([]);

const consume = (
    input: string,
    index: number,
    state: LexerState,
    buffer: string,
    output: readonly string[],
): readonly string[] => {
    if (index >= input.length) {
        return Object.freeze([...output, ...close(buffer)]);
    }
    const char = input.charAt(index);
    const result = stepAt(state, classifyChar(input.charCodeAt(index))).consume(buffer, char);
    return consume(input, index + 1, result.state, result.buffer, Object.freeze([...output, ...result.emitted]));
};

export function tokenizeWords(str: string): readonly string[] {
    return consume(str, 0, LexerState.START, '', Object.freeze([]));
}
