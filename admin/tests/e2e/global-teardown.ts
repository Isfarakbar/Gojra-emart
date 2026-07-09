import path from 'node:path';
import { createRequire } from 'node:module';

const nodeRequire = createRequire(path.join(process.cwd(), 'package.json'));

async function retry<T>(operation: () => Promise<T>, attempts = 5): Promise<T> {
    let lastError: unknown;
    for (let attempt = 1; attempt <= attempts; attempt += 1) {
        try {
            return await operation();
        } catch (error) {
            lastError = error;
            if (attempt < attempts) await new Promise(resolve => setTimeout(resolve, attempt * 1_000));
        }
    }
    throw lastError;
}

export default async function globalTeardown() {
    const backendRoot = path.resolve(process.cwd(), '..', 'backend');
    const database = nodeRequire(path.join(backendRoot, 'config', 'database.js'));
    const User = nodeRequire(path.join(backendRoot, 'models', 'User.js'));
    database.assertSafeTestDatabase(process.env.MONGO_TEST_URI);
    await retry(() => database.connectDatabase({ uri: process.env.MONGO_TEST_URI, testMode: true }));
    await User.db.dropDatabase();
    await database.disconnectDatabase();
}
