import { defineConfig, devices } from '@playwright/test';

const testDatabaseUri = process.env.MONGO_TEST_URI;
if (!testDatabaseUri || !new URL(testDatabaseUri).pathname.endsWith('_test')) {
    throw new Error('MONGO_TEST_URI with a database name ending in "_test" is required.');
}

export default defineConfig({
    testDir: './tests/e2e',
    fullyParallel: false,
    workers: 1,
    retries: 0,
    reporter: [['list'], ['html', { open: 'never' }]],
    use: {
        baseURL: 'http://127.0.0.1:3001',
        screenshot: 'only-on-failure',
        trace: 'retain-on-failure',
    },
    globalSetup: './tests/e2e/global-setup.ts',
    globalTeardown: './tests/e2e/global-teardown.ts',
    webServer: [
        {
            command: 'node server.js',
            cwd: '../backend',
            url: 'http://127.0.0.1:5001/',
            timeout: 120_000,
            reuseExistingServer: false,
            env: {
                ...process.env,
                NODE_ENV: 'test',
                PORT: '5001',
                MONGO_TEST_URI: testDatabaseUri,
            },
        },
        {
            command: 'npm run dev',
            cwd: '.',
            url: 'http://127.0.0.1:3001/login',
            timeout: 120_000,
            reuseExistingServer: false,
            env: {
                ...process.env,
                NEXT_PUBLIC_API_URL: 'http://127.0.0.1:5001/api',
            },
        },
    ],
    projects: [
        {
            name: 'desktop',
            use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 } },
        },
        {
            name: 'mobile',
            use: { ...devices['Pixel 7'], viewport: { width: 390, height: 844 } },
        },
    ],
});
