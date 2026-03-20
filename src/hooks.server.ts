import { sequence } from '@sveltejs/kit/hooks';
import { handleErrorWithSentry, sentryHandle } from '@sentry/sveltekit';
import * as Sentry from '@sentry/sveltekit';
import { error } from '@sveltejs/kit';
import { randomUUID } from 'node:crypto';
import { isCloud, isProd } from '$lib/system';
import { getSaaSConfig } from '$lib/server/saas/config';
import { logRequest, logSecurityWarn } from '$lib/server/logging';
import { ensureTenantAccess, resolveTenantId } from '$lib/server/tenant';

Sentry.init({
    enabled: isCloud && isProd,
    dsn: 'https://c7ce178bdedd486480317b72f282fd39@o1063647.ingest.us.sentry.io/4504158071422976',
    tracesSampleRate: 1.0
});

const requestContextHandle: import('@sveltejs/kit').Handle = async ({ event, resolve }) => {
    const start = Date.now();
    const requestId = randomUUID();
    event.locals.requestId = requestId;
    event.locals.tenantId = resolveTenantId(event);

    const saas = getSaaSConfig();
    const isTenantProtectedPath =
        event.url.pathname.startsWith('/api/tenant/') ||
        event.url.pathname.startsWith('/api/internal/');

    if (saas.enforceTenantGuards && isTenantProtectedPath) {
        const access = ensureTenantAccess(event);
        if (access.ok === false) {
            logSecurityWarn({
                message: 'tenant_guard_blocked',
                requestId,
                method: event.request.method,
                path: event.url.pathname,
                tenantId: event.locals.tenantId,
                details: { reason: access.reason }
            });
            throw error(403, 'Forbidden tenant access');
        }
    }

    const response = await resolve(event);
    response.headers.set('x-request-id', requestId);

    logRequest({
        requestId,
        method: event.request.method,
        path: event.url.pathname,
        status: response.status,
        durationMs: Date.now() - start,
        tenantId: event.locals.tenantId
    });

    return response;
};

export const handle = sequence(requestContextHandle, sentryHandle());

export const handleError = handleErrorWithSentry();
