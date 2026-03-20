<script lang="ts">
    import { goto } from '$app/navigation';
    import { base } from '$app/paths';
    import { Submit, trackEvent, trackError } from '$lib/actions/analytics';
    import { Modal, CustomId } from '$lib/components';
    import { InputText, Button } from '$lib/elements/forms';
    import { addNotification } from '$lib/stores/notifications';
    import { sdk } from '$lib/stores/sdk';
    import { ID, Query } from '@appwrite.io/console';
    import { IconPencil } from '@appwrite.io/pink-icons-svelte';
    import { Icon, Layout, Tag } from '@appwrite.io/pink-svelte';
    import { createEventDispatcher } from 'svelte';
    import { quotaForBillingGroup } from '$lib/saas/quotas';
    import { isCloud } from '$lib/system';

    export let show = false;
    export let teamId: string;

    const dispatch = createEventDispatcher();

    let id: string = '';
    let error: string;
    let showCustomId = false;
    let disabled: boolean = false;
    let name: string = 'New project';
    let showSubmissionLoader = false;

    async function create() {
        try {
            disabled = true;
            showSubmissionLoader = true;

            if (isCloud) {
                const [plan, projects] = await Promise.all([
                    sdk.forConsole.organizations.getPlan({
                        organizationId: teamId
                    }),
                    sdk.forConsole.projects.list({
                        queries: [
                            Query.equal('teamId', teamId),
                            Query.limit(1),
                            Query.select(['$id'])
                        ]
                    })
                ]);

                const quotas = quotaForBillingGroup(plan.group);
                if (projects.total >= quotas.maxProjects) {
                    error = `Project limit reached for this plan (${quotas.maxProjects}). Upgrade your plan to create more projects.`;
                    return;
                }
            }

            const project = await sdk.forConsole.projects.create({
                projectId: id || ID.unique(),
                name,
                teamId
            });
            show = false;
            dispatch('created', project);
            trackEvent(Submit.ProjectCreate, {
                customId: !!id,
                teamId
            });
            addNotification({
                type: 'success',
                message: `${name} has been created`
            });
            await goto(`${base}/project-${project.region ?? 'default'}-${project.$id}`);
        } catch (e) {
            error = e.message;
            trackError(e, Submit.ProjectCreate);
        } finally {
            disabled = false;
            showSubmissionLoader = false;
        }
    }
</script>

<Modal title="Create project" {error} onSubmit={create} bind:show>
    <Layout.Stack gap="l">
        <InputText id="name" label="Name" bind:value={name} required autofocus={true} />
        {#if !showCustomId}
            <span>
                <Tag size="s" on:click={() => (showCustomId = !showCustomId)}>
                    <Icon icon={IconPencil} slot="start" size="s" />
                    Project ID
                </Tag>
            </span>
        {:else}
            <CustomId autofocus bind:show={showCustomId} name="Project" isProject bind:id />
        {/if}
    </Layout.Stack>

    <svelte:fragment slot="footer">
        <Button secondary on:click={() => (show = false)}>Cancel</Button>
        <Button
            submit
            {disabled}
            forceShowLoader={showSubmissionLoader}
            submissionLoader={showSubmissionLoader}>Create</Button>
    </svelte:fragment>
</Modal>
