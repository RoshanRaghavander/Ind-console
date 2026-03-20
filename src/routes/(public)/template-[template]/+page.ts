import { base } from '$app/paths';
import { sdk } from '$lib/stores/sdk.js';
import { isCloud } from '$lib/system.js';
import { redirectTo } from '$routes/store.js';
import { error, redirect } from '@sveltejs/kit';
import { getTeamOrOrganizationList } from '$lib/stores/organization.js';
import type { Models } from '@appwrite.io/console';

export const load = async ({ parent, url, params }) => {
    const { account } = await parent();

    if (!account && !isCloud) {
        redirectTo.set(url.pathname + url.search);
        throw redirect(302, base + '/login?redirect=' + url.pathname + url.search);
    }

    if (!url.searchParams.has('type')) {
        throw error(404, 'Type is not optional');
    }

    const product = url.searchParams.get('type');
    let template: Models.TemplateFunction | Models.TemplateSite;

    switch (product) {
        case 'function':
            template = await sdk.forConsole.functions.getTemplate({
                templateId: params.template
            });
            break;
        case 'site':
            template = await sdk.forConsole.sites.getTemplate({
                templateId: params.template
            });
            break;
        default:
            throw error(404, 'Type is not valid');
    }

    const organizations = account?.$id ? await getTeamOrOrganizationList() : undefined;
    if (!organizations?.total && account?.$id) {
        throw redirect(303, `${base}/onboarding/create-organization${url.search}`);
    }

    return {
        account,
        template: template,
        product,
        organizations
    };
};
