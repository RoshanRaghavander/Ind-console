import { redirect } from '@sveltejs/kit';
import { base, resolve } from '$app/paths';
import type { PageLoad } from './$types';
import { sdk } from '$lib/stores/sdk';
import { VARS } from '$lib/system';

const handleGithubEducationMembership = async (name: string, email: string) => {
    try {
        await sdk.forConsole.console.createProgramMembership({
            programId: 'github-student-developer'
        });

        await setToGhStudentMailingList(name, email);
    } catch (error) {
        if (error.code === 409) {
            throw redirect(303, resolve('/(console)/account/organizations'));
        } else {
            await sdk.forConsole.account.deleteSession({ sessionId: 'current' });
            const errorUrl = resolve('/(public)/(guest)/education/error');
            throw redirect(303, `${errorUrl}?message=${error.message}&code=${error.code}`);
        }
    }
};

const userVisitedEducationPage = (): boolean => {
    const didRegisterGithubEducationProgram =
        localStorage.getItem('githubEducationProgram') === 'true';
    localStorage.removeItem('githubEducationProgram');
    return didRegisterGithubEducationProgram || location.pathname.includes('education');
};

export const load: PageLoad = async ({ parent, url }) => {
    const { organizations, account } = await parent();

    const isApplyingCredit = url.pathname.includes('apply-credit');

    if (userVisitedEducationPage()) {
        await handleGithubEducationMembership(account.name, account.email);
        throw redirect(303, resolve('/'));
    } else if (organizations.total && !isApplyingCredit) {
        const teamId = account.prefs.organization ?? organizations.teams[0].$id;
        if (!teamId) {
            throw redirect(303, `${base}/account/organizations${url.search}`);
        } else {
            throw redirect(303, `${base}/organization-${teamId}${url.search}`);
        }
    } else if (!isApplyingCredit) {
        throw redirect(303, `${base}/onboarding/create-organization${url.search}`);
    }
};

const setToGhStudentMailingList = async (name: string, email: string) => {
    if (!VARS.GROWTH_ENDPOINT) return;
    const body = name !== '' ? { name, email } : { email };
    return fetch(`${VARS.GROWTH_ENDPOINT}/mailinglists/gh-student`, {
        method: 'POST',
        body: JSON.stringify(body),
        headers: {
            'Content-Type': 'application/json'
        }
    });
};
