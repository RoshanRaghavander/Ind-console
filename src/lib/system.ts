import { env } from '$env/dynamic/public';
import { dev } from '$app/environment';

export const enum Mode {
    CLOUD = 'cloud',
    SELF_HOSTED = 'self-hosted'
}

function normalizePublicUrl(value: string | undefined): string | undefined {
    if (!value) return undefined;

    const trimmed = value.trim();
    if (!trimmed) return undefined;

    // Prevent placeholder values from being treated as relative paths.
    if (trimmed.includes('<') || trimmed.includes('>')) return undefined;

    try {
        const url = new URL(trimmed);
        if (url.protocol !== 'http:' && url.protocol !== 'https:') {
            return undefined;
        }
        return url.toString().replace(/\/$/, '');
    } catch {
        return undefined;
    }
}

export const VARS = {
    CONSOLE_MODE: (env.PUBLIC_CONSOLE_MODE as Mode) ?? undefined,
    APPWRITE_ENDPOINT: normalizePublicUrl(env.PUBLIC_APPWRITE_ENDPOINT),
    GROWTH_ENDPOINT: normalizePublicUrl(env.PUBLIC_GROWTH_ENDPOINT),
    PUBLIC_STRIPE_KEY: env.PUBLIC_STRIPE_KEY ?? undefined,
    EMAIL_VERIFICATION: env.PUBLIC_CONSOLE_EMAIL_VERIFICATION === 'true',
    MOCK_AI_SUGGESTIONS: (env.PUBLIC_CONSOLE_MOCK_AI_SUGGESTIONS ?? 'true') === 'true'
};

export const ENV = {
    DEV: dev,
    PROD: !dev,
    PREVIEW: import.meta.env?.VERCEL === '1',
    TEST: !!import.meta.env?.VITEST
};

export const MODE = VARS.CONSOLE_MODE === Mode.CLOUD ? Mode.CLOUD : Mode.SELF_HOSTED;
export const isCloud = MODE === Mode.CLOUD;
export const isSelfHosted = MODE !== Mode.CLOUD;
export const isDev = ENV.DEV;
export const isProd = ENV.PROD;
export const hasStripePublicKey = !!VARS.PUBLIC_STRIPE_KEY;
export const GRACE_PERIOD_OVERRIDE = false;

export const APPWRITE_OFFICIALS_ORG = 'appwriteOfficials';

export function isMultiRegionSupported(url: URL): boolean {
    if (env.PUBLIC_APPWRITE_MULTI_REGION === 'true') return true;

    try {
        return url.hostname === 'cloud.appwrite.io';
    } catch {
        return false;
    }
}

// there can be multiple internal cloud instances.
export function isProductionCloud(url: URL): boolean {
    try {
        return url.hostname === 'cloud.appwrite.io';
    } catch {
        return false;
    }
}
