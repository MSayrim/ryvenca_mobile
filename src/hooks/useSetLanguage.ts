import { useCallback } from 'react';

import { api } from '../api';
import { useSession } from '../auth/SessionProvider';
import { useLanguage, type LanguageCode } from '../i18n';

/**
 * Language picker action: switches the UI immediately, persists the choice on the device, writes it
 * to the account when signed in (`PUT /api/me { language }`) and — when the layout direction changes
 * (LTR ↔ RTL) — offers the restart that React Native needs to mirror the layout.
 */
export function useSetLanguage() {
  const { language, changeLanguage, promptReload } = useLanguage();
  const { status, setUser } = useSession();

  return useCallback(
    async (code: LanguageCode) => {
      if (code === language) return;
      const { needsReload } = await changeLanguage(code, 'user');
      if (status === 'signedIn') {
        try {
          setUser(await api.updateMe({ language: code }));
        } catch {
          // Non-fatal: the device keeps the choice and syncs it on the next explicit login.
        }
      }
      if (needsReload) await promptReload();
    },
    [language, changeLanguage, promptReload, status, setUser],
  );
}
