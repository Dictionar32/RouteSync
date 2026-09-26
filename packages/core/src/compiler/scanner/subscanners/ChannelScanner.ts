import { readSourceText } from './scannerUtils';
/**
 * ChannelScanner.ts
 *
 * Scans routes/channels.php for Broadcast::channel declarations.
 *
 * @module core/compiler/scanner/subscanners/ChannelScanner
 */

import path from "path";
import * as fs from "node:fs";
import { BroadcastChannelKind, type BroadcastChannelDescriptor } from '../../../types/domain/channels';
import type { ChannelAst } from '../../../types/upstream/ast';
import type { SourceProjectIdentity } from "../../../types/upstream/highLevelSourceModel";
import type { SourceSpan } from '../../../types/upstream/provenance';
import type { RouteParameter } from '../../../types/upstream/route';
import { LaravelSourceLexer } from "../LaravelSourceLexer";
import {
    ScannedBroadcastChannelDescriptor
} from "../descriptors/channelDescriptors";
import { ScannedRouteParameterDescriptor } from '../descriptors/route/params/routeParameterDescriptorClass';
import { channelProducer } from './channelProducer';

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

export class ChannelScanner {
    private static async scanDeclarations(sourceProject: SourceProjectIdentity): Promise<readonly ScannedChannelDeclaration[]> {
        const sourceRoot = sourceProject.root.value.value;
        const channelsFile = path.join(sourceRoot, "routes", "channels.php");
        if (!fs.existsSync(channelsFile)) return [];

        const sourceText = await readSourceText(channelsFile);
        const tokens = LaravelSourceLexer.tokenize(sourceText);
        const channels: ScannedChannelDeclaration[] = [];

        for (let i = 0; i < tokens.length; i++) {
            if (tokens[i].value === "channel" && tokens[i - 1]?.value === "::" && tokens[i - 2]?.value === "Broadcast") {
                let pIdx = i + 1;
                if (tokens[pIdx]?.value === "(" && tokens[pIdx + 1]?.type === "STRING") {
                    const pattern = tokens[pIdx + 1].value;
                    const parameters = ChannelScanner.extractPathParams(pattern);
                    const isPresence = pattern.includes("presence") || pattern.includes("chat");
                    const isPrivate = !pattern.startsWith("public.") && !isPresence;
                    const kind = isPresence
                        ? BroadcastChannelKind.Presence
                        : isPrivate
                            ? BroadcastChannelKind.Private
                            : BroadcastChannelKind.Public;

                    channels.push({
                        channel: ScannedBroadcastChannelDescriptor.fromPattern({
                        name: pattern,
                        pattern,
                        parameters,
                        kind,
                        isPrivate,
                        isPresence
                        }),
                        source: source(channelsFile, tokens[i - 2]),
                    });
                }
            }
        }

        return Object.freeze(channels);
    }

    /** Legacy descriptor surface retained for manifest and generator callers. */
    public static async scan(sourceProject: SourceProjectIdentity): Promise<readonly BroadcastChannelDescriptor[]> {
        return (await ChannelScanner.scanDeclarations(sourceProject)).map(item => item.channel);
    }

    /** Canonical source-AST surface with declaration-level provenance. */
    public static async scanCanonicalAsts(sourceProject: SourceProjectIdentity): Promise<readonly ChannelAst[]> {
        return (await ChannelScanner.scanDeclarations(sourceProject)).map(item => channelProducer.produce(item));
    }

    public static extractPathParams(routePath: string): readonly RouteParameter[] {
        const matches = [...routePath.matchAll(/\{([^}]+)\}/g)];
        return matches.map(m => ScannedRouteParameterDescriptor.fromPathSegment(m[1]));
    }
}
