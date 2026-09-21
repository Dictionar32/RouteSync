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
import { BroadcastChannelDescriptor, RouteParameter } from "../../../types/route";
import { LaravelSourceLexer } from "../LaravelSourceLexer";
import {
    ScannedBroadcastChannelDescriptor
} from "../descriptors/channelDescriptors";
import {
    ScannedRouteParameterDescriptor
} from "../descriptors/routeDescriptors";

export class ChannelScanner {
    public static async scan(projectRoot: string): Promise<readonly BroadcastChannelDescriptor[]> {
        const channelsFile = path.join(projectRoot, "routes", "channels.php");
        if (!fs.existsSync(channelsFile)) return [];

        const source = await readSourceText(channelsFile);
        const tokens = LaravelSourceLexer.tokenize(source);
        const channels: BroadcastChannelDescriptor[] = [];

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

                    channels.push(ScannedBroadcastChannelDescriptor.fromPattern({
                        name: pattern,
                        pattern,
                        parameters,
                        kind,
                        isPrivate,
                        isPresence
                    }));
                }
            }
        }

        return channels;
    }

    public static extractPathParams(routePath: string): readonly RouteParameter[] {
        const matches = [...routePath.matchAll(/\{([^}]+)\}/g)];
        return matches.map(m => ScannedRouteParameterDescriptor.fromPathSegment(m[1]));
    }
}
