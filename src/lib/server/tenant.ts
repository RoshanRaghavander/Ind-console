import type { RequestEvent } from '@sveltejs/kit';

const TENANT_HEADER = 'x-tenant-id';

function extractTenantFromPath(pathname: string): string | null {
    const organizationMatch = pathname.match(/organization-([A-Za-z0-9._-]+)/);
    if (organizationMatch?.[1]) return organizationMatch[1];

    const projectMatch = pathname.match(/project-[A-Za-z0-9._-]+-([A-Za-z0-9._-]+)/);
    if (projectMatch?.[1]) return projectMatch[1];

    return null;
}

export function resolveTenantId(event: RequestEvent): string | null {
    const headerTenant = event.request.headers.get(TENANT_HEADER);
    if (headerTenant) return headerTenant;

    const queryTenant = event.url.searchParams.get('tenantId');
    if (queryTenant) return queryTenant;

    return extractTenantFromPath(event.url.pathname);
}

export function ensureTenantAccess(event: RequestEvent): { ok: true } | { ok: false; reason: string } {
    const headerTenant = event.request.headers.get(TENANT_HEADER);
    const resolvedTenant = event.locals.tenantId;

    if (!resolvedTenant) return { ok: false, reason: 'Missing tenant context' };
    if (headerTenant && headerTenant !== resolvedTenant) return { ok: false, reason: 'Tenant mismatch' };

    return { ok: true };
}
