import { BillingPlanGroup } from '@appwrite.io/console';

export type SaaSQuota = {
    maxProjects: number;
    maxMembers: number;
    maxStorageGb: number;
    apiRateLimitPerMinute: number;
    features: Record<string, boolean>;
};

export const DEFAULT_SAAS_QUOTAS: Record<'free' | 'pro' | 'enterprise', SaaSQuota> = {
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

export function quotaForBillingGroup(group: string | undefined): SaaSQuota {
    if (group === BillingPlanGroup.Pro) return DEFAULT_SAAS_QUOTAS.pro;
    if (group === BillingPlanGroup.Enterprise) return DEFAULT_SAAS_QUOTAS.enterprise;
    return DEFAULT_SAAS_QUOTAS.free;
}
