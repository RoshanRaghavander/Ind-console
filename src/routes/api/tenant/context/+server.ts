import { json } from '@sveltejs/kit';
import { getSaaSConfig } from '$lib/server/saas/config';
import type { PlanName } from '$lib/server/saas/config';

const PLAN_HEADER = 'x-tenant-plan';

function resolvePlan(raw: string | null): PlanName {
    if (raw === 'pro' || raw === 'enterprise') return raw;
    return 'free';
}

export function GET({ request, locals }) {
    const saas = getSaaSConfig();
    const plan = resolvePlan(request.headers.get(PLAN_HEADER));

    return json({
        ok: true,
        requestId: locals.requestId,
        tenantId: locals.tenantId,
        plan,
        quotas: saas.plans[plan]
    });
}
