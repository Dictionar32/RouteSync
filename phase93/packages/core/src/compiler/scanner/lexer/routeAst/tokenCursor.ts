import type { TokenDescriptor } from '../phpAstTypes';

/** Syntax-navigation model. Positional arithmetic is private to this abstraction. */
export class TokenCursor {
  private constructor(
    private readonly tokens: readonly TokenDescriptor[],
    private readonly position: number,
  ) {}

  static start(tokens: readonly TokenDescriptor[]): TokenCursor {
    return new TokenCursor(tokens, 0);
  }

  get current(): TokenDescriptor | undefined { return this.tokens[this.position]; }
  get previous(): TokenDescriptor | undefined { return this.tokens[this.position - 1]; }
  get next(): TokenDescriptor | undefined { return this.tokens[this.position + 1]; }
  get afterNext(): TokenDescriptor | undefined { return this.tokens[this.position + 2]; }
  get atEnd(): boolean { return this.position >= this.tokens.length; }
  get terminal(): TokenDescriptor | undefined { return this.tokens[this.tokens.length - 1]; }

  get nextCursor(): TokenCursor { return this.advance(); }
  get afterNextCursor(): TokenCursor { return this.advance().advance(); }

  /** Current token is the method/name of a call: name + `(`. */
  get callOpen(): TokenDescriptor | undefined {
    const candidate = this.next;
    return candidate && candidate.value === '(' ? candidate : undefined;
  }

  get callArgument(): TokenDescriptor | undefined {
    const open = this.callOpen;
    return open ? this.afterNext : undefined;
  }

  get callArgumentCursor(): TokenCursor {
    return this.afterNextCursor;
  }

  get secondCallArgument(): TokenDescriptor | undefined {
    return this.secondCallArgumentCursor.current;
  }

  get secondCallArgumentCursor(): TokenCursor {
    let cursor = this.callArgumentCursor;
    let nestedDepth = 0;
    while (!cursor.atEnd) {
      const value = cursor.current?.value;
      if (value === '(' || value === '[' || value === '{') nestedDepth += 1;
      if (value === ')' && nestedDepth === 0) return cursor;
      if (value === ')' || value === ']' || value === '}') nestedDepth = Math.max(0, nestedDepth - 1);
      if (value === ',' && nestedDepth === 0) return cursor.advance();
      cursor = cursor.advance();
    }
    return cursor;
  }

  /** Cursor at the closing delimiter of the current call, including nested calls. */
  get callCloseCursor(): TokenCursor {
    const open = this.callOpen;
    if (!open) return this;
    let depth = 0;
    let cursor = open;
    while (!cursor.atEnd) {
      const value = cursor.current?.value;
      if (value === '(') depth += 1;
      if (value === ')') {
        depth -= 1;
        if (depth === 0) return cursor;
      }
      cursor = cursor.advance();
    }
    return this;
  }

  get afterCallCursor(): TokenCursor {
    const close = this.callCloseCursor;
    return close === this ? this : close.advance();
  }

  /** Current token starts a class reference such as `Foo::class`. */
  get classReference(): boolean {
    return this.next?.value === '::' && this.afterNext?.value === 'class';
  }

  advance(): TokenCursor { return new TokenCursor(this.tokens, this.position + 1); }

  find(predicate: (token: TokenDescriptor, cursor: TokenCursor) => boolean): TokenCursor | undefined {
    let cursor: TokenCursor = this;
    while (!cursor.atEnd) {
      const token = cursor.current;
      if (token && predicate(token, cursor)) return cursor;
      cursor = cursor.advance();
    }
    return undefined;
  }

  until(predicate: (token: TokenDescriptor, cursor: TokenCursor) => boolean): readonly TokenDescriptor[] {
    const result: TokenDescriptor[] = [];
    let cursor: TokenCursor = this;
    while (!cursor.atEnd) {
      const token = cursor.current;
      if (!token) break;
      if (predicate(token, cursor)) break;
      result.push(token);
      cursor = cursor.advance();
    }
    return Object.freeze(result);
  }

  untilCursor(predicate: (token: TokenDescriptor, cursor: TokenCursor) => boolean): TokenCursor {
    const found = this.find(predicate);
    if (found) return found;
    return this;
  }

  isBefore(other: TokenCursor): boolean {
    return this.position < other.position;
  }
}
