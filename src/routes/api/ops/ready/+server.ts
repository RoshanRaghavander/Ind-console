import { env as publicEnv } from '$env/dynamic/public';
import { json } from '@sveltejs/kit';
import { getSaaSConfig } from '$lib/server/saas/config';

export function GET({ locals }) {
    const required = {
        PUBLIC_APPWRITE_ENDPOINT: publicEnv.PUBLIC_APPWRITE_ENDPOINT
    };

    const missing = Object.entries(required)
        .filter(([, value]) => !value)
        .map(([key]) => key);

    const saas = getSaaSConfig();
    const ready = missing.length === 0;

    return json(
        {
            ok: ready,
            status: ready ? 'ready' : 'degraded',
            requestId: locals.requestId,
            checks: {
                missingEnv: missing,
                tenantGuardsEnabled: saas.enforceTenantGuards
            }
        },
        {
            status: ready ? 200 : 503,
            headers: {
                'cache-control': 'no-store'
            }
        }
    );
}
