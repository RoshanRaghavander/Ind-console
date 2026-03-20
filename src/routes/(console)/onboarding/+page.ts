import { base } from '$app/paths';
import { redirect } from '@sveltejs/kit';
import type { PageLoad } from './$types';

export const load: PageLoad = async ({ parent, url }) => {
    const { organizations } = await parent();

    if (!organizations?.total) {
        throw redirect(303, `${base}/onboarding/create-organization${url.search}`);
    }

    throw redirect(303, `${base}/onboarding/create-project${url.search}`);
};
