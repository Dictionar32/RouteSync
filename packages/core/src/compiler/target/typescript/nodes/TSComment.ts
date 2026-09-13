/**
 * @file TSComment.ts
 * @description TypeScript comment node (JSDoc, single-line, multi-line)
 */

import type { TSNode, SourceSpan, TSNodeKind } from './TSNode';
import type { TSVisitor } from '../visitor/TSVisitor';
import {
    type JSDocTag,
    paramTag,
    returnsTag,
    exampleTag,
    deprecatedTag
} from './TSJSDocTag';

export {
    type JSDocTag,
    paramTag,
    returnsTag,
    exampleTag,
    deprecatedTag
};

export type CommentStyle =
    | 'single-line'
    | 'multi-line'
    | 'jsdoc';

export class TSComment implements TSNode {
    public readonly kind: TSNodeKind = 'comment' as const;

    constructor(
        public readonly text: string,
        public readonly style: CommentStyle = 'single-line',
        public readonly span?: SourceSpan
    ) {
        Object.freeze(this);
    }

    public get isJSDoc(): boolean {
        return this.style === 'jsdoc';
    }

    public get isSingleLine(): boolean {
        return this.style === 'single-line';
    }

    public get isMultiLine(): boolean {
        return this.style === 'multi-line';
    }

    public get lines(): readonly string[] {
        return this.text.split('\n');
    }

    public static singleLine(text: string): TSComment {
        return new TSComment(text, 'single-line');
    }

    public static multiLine(text: string): TSComment {
        return new TSComment(text, 'multi-line');
    }

    public static jsdoc(text: string): TSComment {
        return new TSComment(text, 'jsdoc');
    }

    public static jsdocFromParts(
        description: string,
        tags: readonly JSDocTag[] = []
    ): TSComment {
        const lines: string[] = [description];

        for (const tag of tags) {
            if (tag.name) {
                lines.push(`@${tag.tag} ${tag.name} - ${tag.description}`);
            } else {
                lines.push(`@${tag.tag} ${tag.description}`);
            }
        }

        return new TSComment(lines.join('\n'), 'jsdoc');
    }

    public accept<R>(visitor: TSVisitor<R>): R {
        return visitor.visitComment(this);
    }
}
