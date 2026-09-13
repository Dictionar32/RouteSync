/**
 * routeContextTracker.ts
 *
 * Tracks prefix and middleware stacks during Route token scanning.
 *
 * @module core/compiler/scanner/subscanners/route-scanner
 */

export class RouteContextTracker {
    public prefixStack: string[] = [];
    public pendingPrefix: string | null = null;
    public middlewareStack: string[][] = [];
    public pendingMiddleware: string[] = [];

    public handleToken(tokens: readonly any[], i: number): void {
        // Track Route::prefix('v1')->group(...)
        if (tokens[i].value === 'prefix' && tokens[i + 1]?.value === '(' && tokens[i + 2]?.type === 'STRING') {
            this.pendingPrefix = tokens[i + 2].value.replace(/^\/+|\/+$/g, '');
        }

        // Track Route::middleware(...)
        if (tokens[i].value === 'middleware' && tokens[i + 1]?.value === '(') {
            this.pendingMiddleware = [];
            let mIdx = i + 2;
            if (tokens[mIdx]?.type === 'STRING') {
                this.pendingMiddleware.push(tokens[mIdx].value);
            } else if (tokens[mIdx]?.value === '[') {
                mIdx++;
                while (mIdx < tokens.length && tokens[mIdx].value !== ']') {
                    if (tokens[mIdx].type === 'STRING') {
                        this.pendingMiddleware.push(tokens[mIdx].value);
                    }
                    mIdx++;
                }
            }
        }

        // Group open/close for middleware and prefix stacks
        if (tokens[i].value === 'group' && tokens[i + 1]?.value === '(') {
            this.middlewareStack.push([...this.pendingMiddleware]);
            this.pendingMiddleware = [];
            if (this.pendingPrefix !== null) {
                this.prefixStack.push(this.pendingPrefix);
                this.pendingPrefix = null;
            } else {
                this.prefixStack.push('');
            }
        }
        if (tokens[i].value === '}' && this.middlewareStack.length > 0) {
            this.middlewareStack.pop();
            if (this.prefixStack.length > 0) {
                this.prefixStack.pop();
            }
        }
    }

    public getCurrentMiddlewares(): string[] {
        return this.middlewareStack.flat();
    }

    public isCurrentAuth(): boolean {
        return this.getCurrentMiddlewares().some(m => m.startsWith('auth'));
    }
}
