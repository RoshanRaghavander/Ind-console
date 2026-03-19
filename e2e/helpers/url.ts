function escapeRegex(value: string): string {
    return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function getBasePath(): string {
    return process.env.CONSOLE_BASE_PATH ?? '/console';
}

export function getOrganizationIdFromUrl(pathname: string) {
    const basePath = escapeRegex(getBasePath());
    const regex = new RegExp(`${basePath}/organization-([^/]+)(/.*)?$`);
    const match = pathname.match(regex);

    if (match) {
        return match[1];
    }

    throw new Error('Organization ID not found in pathname');
}

export function getProjectIdFromUrl(pathname: string) {
    const basePath = escapeRegex(getBasePath());
    const regex = new RegExp(`${basePath}/project-(?:[a-z]{2,3}-)?([^/]+)(/.*)?$`);
    const match = pathname.match(regex);

    if (match) {
        return match[1];
    }

    throw new Error('Project ID not found in pathname');
}
