import { test, type Page } from '@playwright/test';

type Metadata = {
    name: string;
    email: string;
    password: string;
};

export function registerUserStep(page: Page): Promise<Metadata> {
    return test.step('register user', async () => {
        const seed = crypto.randomUUID();
        await page.goto('./register');
        const inputs = {
            name: page.locator('id=name'),
            email: page.locator('id=email'),
            password: page.locator('id=password'),
            terms: page.locator('id=terms')
        };
        const values = {
            name: 'testuser ' + seed,
            email: `testuser-${seed}@appwrite.io`,
            password: `Testuser-${seed}-pass`
        };
        await inputs.name.fill(values.name);
        await inputs.email.fill(values.email);
        await inputs.password.fill(values.password);
        await inputs.terms.check({ force: true });
        await page.getByRole('button', { name: 'Sign up', exact: true }).click();
        await page.waitForURL(/\/(onboarding\/create-project|organization-[^/]+)(?:\/|$)/, {
            waitUntil: 'commit'
        });

        return values;
    });
}
