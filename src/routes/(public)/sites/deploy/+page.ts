import { sdk } from '$lib/stores/sdk.js';
import { error, redirect } from '@sveltejs/kit';
import { base } from '$app/paths';
import type { Models } from '@appwrite.io/console';
import { getTeamOrOrganizationList } from '$lib/stores/organization';
import { redirectTo } from '$routes/store';
import type { PageLoad } from './$types';
import { getRepositoryInfo } from '$lib/helpers/github';

export const load: PageLoad = async ({ parent, url }) => {
    const { account } = await parent();

    const fullUrl = url.pathname + url.search;

    if (!account) {
        redirectTo.set(fullUrl);
        throw redirect(302, base + '/login?redirect=' + encodeURIComponent(fullUrl));
    }

    const templateKey = url.searchParams.get('template');
    const repository = url.searchParams.get('repo') || url.searchParams.get('repository');

    if (!templateKey && !repository) {
        throw redirect(302, base + '/');
    }

    if (templateKey && repository) {
        throw error(400, 'Cannot specify both template and repo parameters');
    }

    // Get common parameters
    const name = url.searchParams.get('name');
    const envParam = url.searchParams.get('env');
    const tagline = url.searchParams.get('tagline');
    const screenshot = url.searchParams.get('screenshot');
    const envKeys = envParam ? envParam.split(',').map((key: string) => key.trim()) : [];

    let deploymentData: {
        type: 'template' | 'repo';
        template?: Models.TemplateSite;
        repository?: { url: string; owner: string; name: string };
        screenshot?: string;
        name?: string;
        tagline?: string;
    };

    if (templateKey) {
        try {
            const template = await sdk.forConsole.sites.getTemplate({ templateId: templateKey });
            deploymentData = {
                type: 'template',
                template,
                name: name || template.name,
                tagline: tagline || template.tagline,
                // TODO: maybe get the browser's theme
                //  and select appropriate theme here.
                screenshot: screenshot || template.screenshotLight
            };
        } catch (e) {
            throw error(404, `Template "${templateKey}" not found`);
        }
    } else {
        const info = getRepositoryInfo(repository);
        if (!info) {
            throw redirect(302, base + '/');
        }

        deploymentData = {
            type: 'repo',
            repository: {
                url: repository,
                name: info.name,
                owner: info.owner
            },
            screenshot,
            name: name || info.name,
            tagline
        };
    }

    const organizations = await getTeamOrOrganizationList();
    if (!organizations?.total) {
        throw redirect(303, `${base}/onboarding/create-organization${url.search}`);
    }

    return {
        account,
        organizations,
        deploymentData,
        envKeys
    };
};
