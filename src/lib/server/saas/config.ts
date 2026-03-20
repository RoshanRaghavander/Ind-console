import { env as privateEnv } from '$env/dynamic/private';

export type PlanName = 'free' | 'pro' | 'enterprise';
export type FeatureFlags = Record<string, boolean>;

export type PlanConfig = {
    maxProjects: number;
    maxMembers: number;
    maxStorageGb: number;
    apiRateLimitPerMinute: number;
    features: FeatureFlags;
};

export type SaaSConfig = {
    enforceTenantGuards: boolean;
    plans: Record<PlanName, PlanConfig>;
};

const DEFAULT_PLANS: Record<PlanName, PlanConfig> = {
    free: {
        maxProjects: 1,
        maxMembers: 3,
        maxStorageGb: 1,
        apiRateLimitPerMinute: 120,
        features: {
            customDomains: false,
            auditLogs: false,
            prioritySupport: false
        }
    },
    pro: {
        maxProjects: 10,
        maxMembers: 25,
        maxStorageGb: 100,
        apiRateLimitPerMinute: 1200,
        features: {
            customDomains: true,
            auditLogs: true,
            prioritySupport: false
        }
    },
    enterprise: {
        maxProjects: 1000,
        maxMembers: 10000,
        maxStorageGb: 10000,
        apiRateLimitPerMinute: 10000,
        features: {
            customDomains: true,
            auditLogs: true,
            prioritySupport: true
        }
    }
};

function parsePositiveInt(input: string | undefined, fallback: number): number {
    if (!input) return fallback;
    const num = Number.parseInt(input, 10);
    if (!Number.isFinite(num) || num <= 0) return fallback;
    return num;
}

function parseFeatureFlags(raw: string | undefined, fallback: FeatureFlags): FeatureFlags {
    if (!raw) return fallback;
    try {
        const parsed = JSON.parse(raw);
        if (!parsed || typeof parsed !== 'object') return fallback;
        return Object.fromEntries(
            Object.entries(parsed).filter(
                (entry): entry is [string, boolean] => typeof entry[1] === 'boolean'
            )
        );
    } catch {
        return fallback;
    }
}

function readPlan(name: PlanName): PlanConfig {
    const prefix = `SAAS_PLAN_${name.toUpperCase()}_`;
    const fallback = DEFAULT_PLANS[name];

    return {
        maxProjects: parsePositiveInt(privateEnv[`${prefix}MAX_PROJECTS`], fallback.maxProjects),
        maxMembers: parsePositiveInt(privateEnv[`${prefix}MAX_MEMBERS`], fallback.maxMembers),
        maxStorageGb: parsePositiveInt(
            privateEnv[`${prefix}MAX_STORAGE_GB`],
            fallback.maxStorageGb
        ),
        apiRateLimitPerMinute: parsePositiveInt(
            privateEnv[`${prefix}API_RATE_LIMIT_PER_MINUTE`],
            fallback.apiRateLimitPerMinute
        ),
        features: parseFeatureFlags(privateEnv[`${prefix}FEATURE_FLAGS`], fallback.features)
    };
}

let cachedConfig: SaaSConfig | null = null;

export function getSaaSConfig(): SaaSConfig {
    if (cachedConfig) return cachedConfig;

    cachedConfig = {
        enforceTenantGuards: privateEnv.SAAS_ENFORCE_TENANT_GUARDS === 'true',
        plans: {
            free: readPlan('free'),
            pro: readPlan('pro'),
            enterprise: readPlan('enterprise')
        }
    };

    return cachedConfig;
}

export function getPlanConfig(plan: PlanName): PlanConfig {
    return getSaaSConfig().plans[plan];
}
