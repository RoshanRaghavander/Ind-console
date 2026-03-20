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

export async function enterCreditCard(page: Page) {
    // click the `add` button inside correct view layer
    const addPaymentButton = page
        .locator('#no-payments-card-stack')
        .getByRole('button', { name: /^add$/i })
        .first();
    await addPaymentButton.waitFor({ state: 'visible' });
    await addPaymentButton.click();

    const modalBackdrop = page.locator('.payment-modal-backdrop');
    await modalBackdrop.waitFor({ state: 'visible' });
    await page.getByRole('heading', { name: /add payment method/i }).waitFor();

    await page.getByLabel('Cardholder name').fill('Test User');

    const stripeFrameElement = page
        .locator('iframe[title*="Secure"], iframe[name^="__privateStripeFrame"]')
        .first();
    await stripeFrameElement.waitFor({ state: 'visible' });
    const stripeFrame = await stripeFrameElement.contentFrame();
    if (!stripeFrame) {
        throw new Error('Stripe frame not found');
    }

    const cardNumber = stripeFrame.locator('input[name="cardnumber"], #payment-numberInput');
    const cardExpiry = stripeFrame.locator('input[name="exp-date"], #payment-expiryInput');
    const cardCvc = stripeFrame.locator('input[name="cvc"], #payment-cvcInput');
    const cardCountry = stripeFrame.locator('select[name="country"], #payment-countryInput');

    await cardNumber.waitFor({ state: 'visible' });

    await cardNumber.fill('4242424242424242');
    await cardExpiry.fill('1250');
    await cardCvc.fill('123');
    if (await cardCountry.count()) {
        await cardCountry.selectOption('DE');
    }

    await modalBackdrop.getByRole('button', { name: /^add$/i }).click();

    const statePicker = modalBackdrop.locator('id=state-picker');
    if (await statePicker.isVisible()) {
        await statePicker.click();
        await modalBackdrop.getByRole('option', { name: 'Alabama' }).click();
        await modalBackdrop.getByRole('button', { name: /^add$/i }).click();
    }

    await modalBackdrop.waitFor({ state: 'hidden' });
}

export async function createProProject(page: Page): Promise<Metadata> {
    const organizationId = await test.step('create organization', async () => {
        await page.goto('./create-organization');
        await page.locator('id=name').fill('test org');
        await page.getByRole('radio', { name: /^Pro\b/ }).check();
        // `create organization` because there's already free created on start!
        await page.getByRole('button', { name: /create organization/i }).click();
        await enterCreditCard(page);
        // skip members
        await page.getByRole('button', { name: /create organization/i }).click();
        await page.waitForURL(/\/organization-[^/]+/);

        return getOrganizationIdFromUrl(page.url());
    });

    const projectId = await test.step('create project', async () => {
        await page.waitForURL(/\/organization-[^/]+/);
        await dismissBlockingModal(page);
        await page
            .getByRole('button', { name: /create project/i })
            .first()
            .click();
        const dialog = page.locator('dialog[open]');

        await dialog.waitFor({ state: 'visible' });
        await dialog.getByPlaceholder('Project name').fill('test project');

        const region = await selectFirstEnabledRegion(page, dialog, 'fra');

        await dialog.getByRole('button', { name: /^create$/i }).click();
        await page.waitForURL(new RegExp(`/project-${region}-[^/]+`));
        expect(page.url()).toContain(`/console/project-${region}-`);

        return getProjectIdFromUrl(page.url());
    });

    return {
        id: projectId,
        organizationId
    };
}
