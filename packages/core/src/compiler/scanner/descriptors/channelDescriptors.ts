/**
 * channelDescriptors.ts
 *
 * AST descriptors for Laravel Broadcast channels.
 *
 * @module core/compiler/scanner/descriptors/channelDescriptors
 */

import {
    BroadcastChannelKind,
    BroadcastChannelDescriptor,
    PublicBroadcastChannelDescriptor,
    PrivateBroadcastChannelDescriptor,
    PresenceBroadcastChannelDescriptor,
    RouteParameter
} from "../../../types/route";

export interface ScannedBroadcastChannelParams {
    readonly name: string;
    readonly kind: BroadcastChannelKind;
    readonly pattern: string;
    readonly runtimePattern: string;
    readonly parameters: readonly RouteParameter[];
    readonly isPrivate: boolean;
    readonly isPresence: boolean;
}

/**
 * Reusable Constructor: Scanned Broadcast Channel Descriptor.
 */
export class ScannedBroadcastChannelDescriptor implements BroadcastChannelDescriptor {
    public readonly name: string;
    public readonly kind: BroadcastChannelKind;
    public readonly pattern: string;
    public readonly runtimePattern: string;
    public readonly parameters: readonly RouteParameter[];
    public readonly isPrivate: boolean;
    public readonly isPresence: boolean;

    constructor({ name, kind, pattern, runtimePattern, parameters, isPrivate, isPresence }: ScannedBroadcastChannelParams) {
        this.name = name;
        this.kind = kind;
        this.pattern = pattern;
        this.runtimePattern = runtimePattern;
        this.parameters = Object.freeze(parameters);
        this.isPrivate = isPrivate;
        this.isPresence = isPresence;
        Object.freeze(this);
    }

    public static create({
        name,
        pattern,
        kind,
        parameters = [],
        isPrivate,
        isPresence
    }: {
        readonly name: string;
        readonly pattern?: string;
        readonly kind?: BroadcastChannelKind;
        readonly parameters?: readonly RouteParameter[];
        readonly isPrivate?: boolean;
        readonly isPresence?: boolean;
    }): ScannedBroadcastChannelDescriptor {
        const resolvedPattern = pattern ?? name;
        const runtimePattern = resolvedPattern.replace(/\{([^}]+)\}/g, (_, pName) => {
            const cleanName = pName.split(":")[0];
            const matched = parameters.find(p => p.name === cleanName);
            return `\${${matched?.propertyName || cleanName}}`;
        });
        const presence = isPresence ?? (kind === BroadcastChannelKind.Presence || resolvedPattern.includes("presence") || resolvedPattern.includes("chat"));
        const priv = isPrivate ?? (kind === BroadcastChannelKind.Private || (!resolvedPattern.startsWith("public.") && !presence));
        const resolvedKind = kind ?? (presence ? BroadcastChannelKind.Presence : priv ? BroadcastChannelKind.Private : BroadcastChannelKind.Public);
        return new ScannedBroadcastChannelDescriptor({
            name,
            kind: resolvedKind,
            pattern: resolvedPattern,
            runtimePattern,
            parameters,
            isPrivate: priv,
            isPresence: presence
        });
    }

    public static fromPattern({
        name,
        pattern,
        kind,
        parameters = []
    }: {
        readonly name: string;
        readonly pattern?: string;
        readonly kind?: BroadcastChannelKind;
        readonly parameters?: readonly RouteParameter[];
    }): ScannedBroadcastChannelDescriptor {
        return ScannedBroadcastChannelDescriptor.create({ name, pattern, kind, parameters });
    }

    public static public({
        name,
        pattern,
        parameters = []
    }: {
        readonly name: string;
        readonly pattern?: string;
        readonly parameters?: readonly RouteParameter[];
    }): PublicBroadcastChannelDescriptor {
        const resolvedPattern = pattern ?? name;
        const runtimePattern = resolvedPattern.replace(/\{([^}]+)\}/g, (_, pName) => {
            const cleanName = pName.split(":")[0];
            const matched = parameters.find(p => p.name === cleanName);
            return `\${${matched?.propertyName || cleanName}}`;
        });
        return Object.freeze({
            name,
            kind: BroadcastChannelKind.Public,
            pattern: resolvedPattern,
            runtimePattern,
            parameters: Object.freeze([...parameters]),
            isPrivate: false as const,
            isPresence: false as const
        });
    }

    public static private({
        name,
        pattern,
        parameters = []
    }: {
        readonly name: string;
        readonly pattern?: string;
        readonly parameters?: readonly RouteParameter[];
    }): PrivateBroadcastChannelDescriptor {
        const resolvedPattern = pattern ?? name;
        const runtimePattern = resolvedPattern.replace(/\{([^}]+)\}/g, (_, pName) => {
            const cleanName = pName.split(":")[0];
            const matched = parameters.find(p => p.name === cleanName);
            return `\${${matched?.propertyName || cleanName}}`;
        });
        return Object.freeze({
            name,
            kind: BroadcastChannelKind.Private,
            pattern: resolvedPattern,
            runtimePattern,
            parameters: Object.freeze([...parameters]),
            isPrivate: true as const,
            isPresence: false as const
        });
    }

    public static presence({
        name,
        pattern,
        parameters = []
    }: {
        readonly name: string;
        readonly pattern?: string;
        readonly parameters?: readonly RouteParameter[];
    }): PresenceBroadcastChannelDescriptor {
        const resolvedPattern = pattern ?? name;
        const runtimePattern = resolvedPattern.replace(/\{([^}]+)\}/g, (_, pName) => {
            const cleanName = pName.split(":")[0];
            const matched = parameters.find(p => p.name === cleanName);
            return `\${${matched?.propertyName || cleanName}}`;
        });
        return Object.freeze({
            name,
            kind: BroadcastChannelKind.Presence,
            pattern: resolvedPattern,
            runtimePattern,
            parameters: Object.freeze([...parameters]),
            isPrivate: true as const,
            isPresence: true as const
        });
    }
}
