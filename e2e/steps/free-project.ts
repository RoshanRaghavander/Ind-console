import { test, expect, type Locator, type Page } from '@playwright/test';
import { getOrganizationIdFromUrl, getProjectIdFromUrl } from '../helpers/url';

type Metadata = {
    id: string;
    organizationId: string;
};

async function dismissBlockingModal(page: Page) {
    const closeButton = page.getByRole('button', { name: /close modal/i });
    if (await closeButton.count()) {
        try {
            if (await closeButton.first().isVisible()) {
                await closeButton.first().click();
            }
        } catch {
            return;
        }
    }
}

async function selectFirstEnabledRegion(
    page: Page,
    scope: Page | Locator,
    fallback: string
): Promise<string> {
    let region = fallback;
    const regionPicker = scope.locator('button[role="combobox"]');
    if (await regionPicker.isVisible()) {
        await regionPicker.click();
        const firstEnabledOption = page
            .locator('[role="option"]:not([data-disabled="true"])')
            .first();

        if ((await firstEnabledOption.count()) > 0) {
            const selectedRegion = await firstEnabledOption.getAttribute('data-value');
            await firstEnabledOption.click();
            region = selectedRegion?.replace(/"/g, '') || fallback;
        }
    }
    return region;
}

export async function createFreeProject(page: Page): Promise<Metadata> {
    const organizationId = await test.step('create organization', async () => {
        await page.goto('./');
        await page.waitForURL(/\/(organization-[^/]+|onboarding\/create-project)(?:\/|$)/);
        if (page.url().includes('/organization-')) {
            return getOrganizationIdFromUrl(page.url());
        }
        return 'unknown';
    });

    const projectId = await test.step('create project', async () => {
        await page.waitForURL(/\/(organization-[^/]+|onboarding\/create-project)(?:\/|$)/);

        let region = 'fra';

        if (page.url().includes('/onboarding/create-project')) {
            await page.getByPlaceholder('Project name').fill('test project');
            region = await selectFirstEnabledRegion(page, page, region);
            await page.getByRole('button', { name: /^Create$/i }).click();
        } else {
            await dismissBlockingModal(page);
            await page
                .getByRole('button', { name: /create project/i })
                .first()
                .click();

            const dialog = page.locator('dialog[open]');
            try {
                await dialog.waitFor({ state: 'visible', timeout: 5000 });
                await dialog.getByPlaceholder('Project name').fill('test project');
                region = await selectFirstEnabledRegion(page, dialog, region);
                await dialog.getByRole('button', { name: /^create$/i }).click();
            } catch {
                await page.waitForURL(/\/onboarding\/create-project(?:\/|$)/);
                await page.getByPlaceholder('Project name').fill('test project');
                region = await selectFirstEnabledRegion(page, page, region);
                await page.getByRole('button', { name: /^Create$/i }).click();
            }
        }

        await page.waitForURL(new RegExp(`/project-${region}-[^/]+`));
        expect(page.url()).toContain(`/console/project-${region}-`);

        return getProjectIdFromUrl(page.url());
    });

    return {
        id: projectId,
        organizationId
    };
}
