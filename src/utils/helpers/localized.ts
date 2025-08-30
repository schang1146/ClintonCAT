import { useCallback } from 'react';

export function useI18n() {
    const t = useCallback((key: string, substitutions?: string | string[]) => {
        const i18n = chrome.i18n || browser.i18n;
        const message = i18n.getMessage(key, substitutions);

        if (message) {
            return message;
        }

        console.log('useI18n: translation missing', key);
        return key;
    }, []);

    return { t };
}
