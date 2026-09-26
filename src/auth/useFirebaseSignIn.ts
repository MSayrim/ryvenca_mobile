import { useMutation } from '@tanstack/react-query';

import { api } from '../api';
import { useToast } from '../components/Toast';
import { useTranslation } from '../i18n';
import { signOutFirebase } from './firebase/firebaseAuth';
import type { FirebaseSignInResult } from './firebase/types';
import { useSession } from './SessionProvider';

/**
 * Runs a Firebase sign-in flow, then exchanges the Firebase ID token for a RYVENCA token
 * (`POST /api/auth/firebase`) and stores it exactly like the legacy login.
 * Resolves `false` when the user cancelled the provider dialog. If the exchange fails (e.g.
 * `403 ACCOUNT_DISABLED`, `503 AUTH_UNAVAILABLE`) the device is signed out of Firebase again and the error
 * (with the server's localized message) is thrown.
 */
export function useFirebaseSignIn() {
  const { signIn } = useSession();
  const toast = useToast();
  const { t } = useTranslation();

  return useMutation<boolean, unknown, () => Promise<FirebaseSignInResult | null>>({
    mutationFn: async (flow) => {
      const result = await flow();
      if (!result) return false;
      try {
        const auth = await api.firebaseSignIn({ idToken: result.idToken, displayName: result.displayName });
        await signIn(auth);
      } catch (error) {
        await signOutFirebase();
        throw error;
      }
      if (result.verificationSent && result.email) {
        toast.show(t('auth.email.verificationSent', { email: result.email }));
      }
      return true;
    },
  });
}
