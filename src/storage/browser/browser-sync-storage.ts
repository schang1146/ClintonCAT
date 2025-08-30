import { IStorageBackend } from '@/storage/istorage-backend';
import getBrowserLastError from '@/utils/helpers/get-browser-last-error';
import browser from 'webextension-polyfill';

class BrowserSyncStorage implements IStorageBackend {
    private buffer = new Map<string, unknown>();
    private removals: string[] = [];
    private flushTimeout: NodeJS.Timeout | null = null;
    private timestamps = new Set<number>();

    /**
     * Stores a value under the given key in browser.storage.sync.
     * The value is JSON-stringified first.
     */
    async set(key: string, value: unknown): Promise<void> {
        const currentValue = await this.get(key);
        try {
            if (currentValue != value) {
                const toStore = JSON.stringify(value);
                if (this.checkQueue()) {
                    this.buffer.set(key, toStore);

                    console.log(`BrowserSyncStorage.set Added to buffer: ${key} = ${toStore}`);

                    this.scheduleSync();
                } else {
                    await browser.storage.sync.set({ [key]: toStore });
                    console.log(`BrowserSyncStorage.set: ${key} = ${toStore}`);
                    return;
                }
            } else {
                console.log(`BrowserSyncStorage.set: Value is unchanged`);
            }
        } catch (_error) {
            throw getBrowserLastError();
        }
        // eslint-disable-next-line @typescript-eslint/no-empty-function
        await new Promise(() => {});
    }

    /**
     * Retrieves a value from browser.storage.sync for the given key.
     * The stored value is JSON-parsed before returning.
     */
    async get(key: string): Promise<unknown> {
        try {
            let rawValue: unknown;
            if (this.buffer.has(key)) {
                rawValue = await new Promise(() => {
                    return this.buffer.get(key);
                });
            } else {
                const result = await browser.storage.sync.get(key);
                rawValue = result[key];
            }

            console.log('Raw value', rawValue, typeof rawValue);

            if (rawValue === undefined || rawValue === null) {
                console.log(`BrowserSyncStorage.get: ${key} => null`);
                return null;
            }

            if (typeof rawValue !== 'string') {
                console.warn(`BrowserSyncStorage.get: stored value for '${key}' is not a string. Returning null.`);
                return null;
            }

            try {
                const parsedValue = JSON.parse(rawValue) as unknown;
                console.log(`BrowserSyncStorage.get: ${key} =>`, parsedValue);

                return parsedValue !== null ? parsedValue : null;
            } catch (_error) {
                console.warn(
                    `BrowserSyncStorage.get: could not parse value for key '${key}'. Returning raw value as string.`
                );
                return rawValue;
            }
        } catch (_error) {
            throw getBrowserLastError();
        }
    }

    async remove(key: string): Promise<void> {
        if (this.checkQueue()) {
            this.buffer.delete(key);
            this.removals.push(key);

            this.scheduleSync();
        } else {
            try {
                await browser.storage.sync.remove(key);
                console.log(`BrowserSyncStorage.remove: ${key}`);
            } catch (_error) {
                throw getBrowserLastError();
            }
            return;
        }
        // eslint-disable-next-line @typescript-eslint/no-empty-function
        await new Promise(() => {});
    }

    private scheduleSync(delay = 1000): void {
        if (this.flushTimeout) clearTimeout(this.flushTimeout);
        this.flushTimeout = setTimeout(() => {
            (async () => {
                if (this.buffer.size > 0) {
                    const toSave = { ...Object.fromEntries(this.buffer) };
                    try {
                        await browser.storage.sync.set(toSave);

                        console.log('sync to storage.sync.set:', toSave);
                    } catch (err) {
                        console.error('Failed to sync to storage.sync.set:', err);
                        throw getBrowserLastError();
                    }
                }
                if (this.removals.length > 0) {
                    const toRemove = [...this.removals];
                    this.removals = [];
                    try {
                        await browser.storage.sync.remove(toRemove);

                        console.log('sync to storage.sync.remove:', toRemove);
                    } catch (err) {
                        console.error('Failed to sync to storage.sync.remove:', err);
                        throw getBrowserLastError();
                    }
                }
                this.buffer.clear();
            })();
        }, delay);
    }

    private checkQueue(): boolean {
        const now = Date.now();

        this.timestamps.add(now);

        for (const ts of this.timestamps) {
            if (ts + 60 * 1000 < now) {
                this.timestamps.delete(ts);
            }
        }

        return this.timestamps.size > 10;
    }
}

export default BrowserSyncStorage;
