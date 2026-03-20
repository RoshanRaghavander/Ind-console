import { isCloud } from '$lib/system';
import { redirect } from '@sveltejs/kit';
import { resolve } from '$app/paths';

export async function load({ parent }) {
    if (!isCloud) throw redirect(303, resolve('/'));
    const { account } = await parent();
    if (!account) throw redirect(303, resolve('/(public)/(guest)/login'));

    throw redirect(303, resolve('/(public)/card/[uid]', { uid: account.$id }));
}
