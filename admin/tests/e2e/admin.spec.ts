import { expect, Page, test } from '@playwright/test';

const routes = [
    ['/', 'Dashboard'],
    ['/products', 'Products'],
    ['/inventory', 'Inventory'],
    ['/categories', 'Categories'],
    ['/orders', 'Orders'],
    ['/whatsapp', 'WhatsApp Inbox'],
    ['/riders', 'Delivery Riders'],
    ['/promos', 'Promo Codes'],
    ['/notifications', 'Notifications'],
    ['/support', 'Support Inbox'],
    ['/reviews', 'Product Reviews'],
    ['/reports', 'Reports'],
    ['/users', 'Customers'],
    ['/settings/store', 'Store Settings'],
    ['/settings/home', 'Home Layout'],
] as const;

async function login(page: Page) {
    await page.goto('/login');
    await page.getByPlaceholder('admin@gojraemart.com').fill('e2e-admin@gojra.test');
    await page.getByPlaceholder('••••••••').fill('E2EAdmin123!');
    await page.getByRole('button', { name: 'Sign In to Admin' }).click();
    await expect(page).toHaveURL('/');
}

function watchRuntimeFailures(page: Page) {
    const failures: string[] = [];
    page.on('pageerror', error => failures.push(`pageerror: ${error.message}`));
    page.on('console', message => {
        if (message.type() === 'error') failures.push(`console: ${message.text()}`);
    });
    page.on('response', response => {
        if (response.status() >= 500) failures.push(`${response.status()} ${response.url()}`);
    });
    return failures;
}

test('unauthenticated dashboard redirects to login', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveURL(/\/login$/);
});

test('admin login, every page, runtime health, and responsive containment', async ({ page }) => {
    await login(page);
    const failures = watchRuntimeFailures(page);

    for (const [route, heading] of routes) {
        await page.goto(route);
        await expect(page.getByRole('heading', { name: heading }).first()).toBeVisible();
        await expect.poll(async () => page.evaluate(() =>
            Array.from(document.images).filter(image => image.complete && image.naturalWidth === 0).length
        )).toBe(0);
        const pageOverflows = await page.evaluate(() =>
            document.documentElement.scrollWidth > document.documentElement.clientWidth + 1
        );
        expect(pageOverflows, `${route} must not overflow the page`).toBe(false);
    }

    expect(failures).toEqual([]);
});

test('WhatsApp message can be reviewed and converted', async ({ page }) => {
    await login(page);
    await page.goto('/whatsapp');
    await page.getByRole('button', { name: 'Review' }).click();
    await page.getByLabel('Status').selectOption('Converted');
    await page.getByLabel('Conversion notes').fill('Converted by Playwright test.');
    await page.getByRole('button', { name: 'Save' }).click();
    await expect(page.getByLabel('Status')).toHaveValue('Converted');
    await expect(page.getByLabel('Conversion notes')).toHaveValue('Converted by Playwright test.');
    await page.getByRole('button', { name: 'Close' }).click();
    await expect(page.locator('tbody').getByText('Converted', { exact: true })).toBeVisible();
});

test('mobile navigation drawer opens and closes', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'mobile', 'Mobile project only');
    await login(page);
    const openButton = page.getByRole('button', { name: 'Open navigation' });
    await expect(openButton).toBeVisible();
    await openButton.click();
    await expect(page.getByRole('link', { name: 'Products' })).toBeVisible();
    await page.getByRole('link', { name: 'Products' }).click();
    await expect(page).toHaveURL('/products');
});
