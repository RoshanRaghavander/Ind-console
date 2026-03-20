import type { PageLoad } from './$types';
import { sdk } from '$lib/stores/sdk';
import { type Models, Query } from '@appwrite.io/console';
import { redirect } from '@sveltejs/kit';
import { base } from '$app/paths';

// TODO: this needs to be cleaned up!
export const load: PageLoad = async ({ parent }) => {
    const { account, organizations } = await parent();

    const accountPrefs = account.prefs;
    const hasCompletedOnboarding = accountPrefs['newOnboardingCompleted'] ?? false;

    // user has already seen it, lets redirect now!
    if (hasCompletedOnboarding && !organizations?.total) {
        throw redirect(303, `${base}/onboarding/create-organization`);
    } else if (hasCompletedOnboarding && organizations?.total) {
        throw redirect(303, `${base}/organization-${organizations.teams[0].$id}`);
    }

    if (!organizations?.total) {
        throw redirect(303, `${base}/onboarding/create-organization`);
    } else if (organizations?.total === 1) {
        const org = organizations.teams[0];
        let projects: Models.ProjectList = null;
        try {
            projects = await sdk.forConsole.projects.list({
                queries: [Query.equal('teamId', org.$id), Query.limit(1), Query.select(['$id'])]
            });
        } catch (e) {
            throw redirect(303, `${base}/organization-${org.$id}`);
        }
        if (!projects?.total) {
            return {
                accountPrefs,
                organization: org
            };
        } else {
            throw redirect(303, `${base}/organization-${org.$id}`);
        }
    } else {
        throw redirect(303, `${base}/organization-${organizations.teams[0].$id}`);
    }
};
