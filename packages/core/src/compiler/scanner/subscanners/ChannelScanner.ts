import { readSourceText } from './scannerUtils';
import path from "path";
import * as fs from "node:fs";
import { BroadcastChannelKind, type BroadcastChannelDescriptor } from '../../../types/domain/channels';
import type { ChannelAst } from '../../../types/upstream/ast';
import type { SourceProjectIdentity } from "../../../types/upstream/highLevelSourceModel";
import type { SourceSpan } from '../../../types/upstream/provenance';
import type { RouteParameter } from '../../../types/upstream/route';
import { LaravelSourceLexer } from "../LaravelSourceLexer";
import type { TokenDescriptor } from '../lexer/phpAstTypes';
import { createBroadcastChannel } from "../descriptors/channel/channelFactories";
import { RouteParameterSemanticFactory } from '../semantic/route/routeParameterSemanticFactory';
import { channelProducer } from './channelProducer';
import { relationAll, relationAny, relationEqual } from '../../../semantic/kernel/semanticRelations';
import { relationGate, relationProject } from '../../../semantic/kernel/relationalSequence';

type ScannedChannelDeclaration = {
    readonly channel: BroadcastChannelDescriptor;
    readonly source: SourceSpan;
};

const source = (file: string, token: { readonly startOffset: number; readonly endOffset: number }): SourceSpan => ({
    kind: 'source_span',
    file: { kind: 'source_file', value: { kind: 'string_value', value: file } },
    start: { kind: 'number_value', value: token.startOffset },
    end: { kind: 'number_value', value: token.endOffset },
});

const declarationAt = (
    file: string,
    tokens: readonly TokenDescriptor[],
    index: number,
): ScannedChannelDeclaration[] => {
    const token = tokens[index];
    const previous = tokens[index - 1];
    const owner = tokens[index - 2];
    const declaration = relationAll([
        relationEqual(token?.value, 'channel'),
        relationEqual(previous?.value, '::'),
        relationEqual(owner?.value, 'Broadcast'),
    ]);
    return relationGate(
        declaration,
        () => {
            const open = tokens[index + 1];
            const patternToken = tokens[index + 2];
            const valid = relationAll([relationEqual(open?.value, '('), relationEqual(patternToken?.type, 'STRING')]);
            return relationGate(valid, () => {
                const pattern = patternToken.value;
                const parameters = ChannelScanner.extractPathParams(pattern);
                const isPresence = relationAny([pattern.includes('presence'), pattern.includes('chat')]);
                const isPrivate = relationAll([relationEqual(pattern.startsWith('public.'), false), relationEqual(isPresence, false)]);
                const kind = relationGate(
                    isPresence,
                    () => BroadcastChannelKind.Presence,
                    () => relationGate(isPrivate, () => BroadcastChannelKind.Private, () => BroadcastChannelKind.Public),
                );
                return [{
                    channel: createBroadcastChannel({
                        name: pattern,
                        pattern,
                        parameters,
                        kind,
                        isPrivate,
                        isPresence,
                    }),
                    source: source(file, owner),
                }];
            }, () => []);
        },
        () => [],
    );
};

const scanTokens = (
    file: string,
    tokens: readonly TokenDescriptor[],
    index = 0,
): readonly ScannedChannelDeclaration[] => relationGate(
    relationEqual(index, tokens.length),
    () => [],
    () => [...declarationAt(file, tokens, index), ...scanTokens(file, tokens, index + 1)],
);

export class ChannelScanner {
    private static async scanDeclarations(sourceProject: SourceProjectIdentity): Promise<readonly ScannedChannelDeclaration[]> {
        const sourceRoot = sourceProject.root.value.value;
        const channelsFile = path.join(sourceRoot, "routes", "channels.php");
        return relationGate(
            fs.existsSync(channelsFile),
            async () => {
                const sourceText = await readSourceText(channelsFile);
                const tokens = LaravelSourceLexer.tokenize(sourceText);
                return Object.freeze(scanTokens(channelsFile, tokens));
            },
            async () => [],
        );
    }

    public static async scan(sourceProject: SourceProjectIdentity): Promise<readonly BroadcastChannelDescriptor[]> {
        return relationProject(await ChannelScanner.scanDeclarations(sourceProject), item => item.channel);
    }

    public static async scanCanonicalAsts(sourceProject: SourceProjectIdentity): Promise<readonly ChannelAst[]> {
        return relationProject(await ChannelScanner.scanDeclarations(sourceProject), item => channelProducer.produce(item));
    }

    public static extractPathParams(routePath: string): readonly RouteParameter[] {
        const matches = Array.from(routePath.matchAll(/\{([^}]+)\}/g));
        return relationProject(matches, match => RouteParameterSemanticFactory.fromPathSegment(match[1]));
    }
}
