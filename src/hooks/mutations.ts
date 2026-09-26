import { useMutation, useQueryClient, type QueryClient } from '@tanstack/react-query';

import { api, queryKeys } from '../api';
import type { Garment, GarmentRequest, Outfit, UpdateMeRequest } from '../api/types';
import { prepareAccountDeletion } from '../auth/firebase/firebaseAuth';
import { useSession } from '../auth/SessionProvider';
import { useLanguage } from '../i18n';
import { outfitGarmentIds, patchGarmentsInData, patchOutfitsInData } from '../utils/outfit';

/** Invalidate everything derived from the wardrobe (after garment create/update/delete). */
export function invalidateWardrobe(queryClient: QueryClient) {
  return Promise.all([
    queryClient.invalidateQueries({ queryKey: queryKeys.garments.all }),
    queryClient.invalidateQueries({ queryKey: queryKeys.homeAll }),
    queryClient.invalidateQueries({ queryKey: queryKeys.outfits.all }),
  ]);
}

function patchOutfitEverywhere(queryClient: QueryClient, key: string, patch: Partial<Outfit>) {
  for (const root of [queryKeys.outfits.all, queryKeys.homeAll, queryKeys.garments.all]) {
    queryClient.setQueriesData({ queryKey: root }, (data: unknown) => patchOutfitsInData(data, key, patch));
  }
}

/** Save / unsave an outfit (POST or DELETE /api/outfits/saved), with instant UI feedback. */
export function useToggleSaveOutfit() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (outfit: Outfit): Promise<Outfit | null> => {
      if (outfit.saved && outfit.savedId != null) {
        await api.deleteSavedOutfit(outfit.savedId);
        return null;
      }
      return api.saveOutfit({ garmentIds: outfitGarmentIds(outfit), title: null });
    },
    onMutate: (outfit) => {
      patchOutfitEverywhere(queryClient, outfit.key, { saved: !outfit.saved });
    },
    onSuccess: (result, outfit) => {
      patchOutfitEverywhere(queryClient, outfit.key, {
        saved: result !== null,
        savedId: result ? result.savedId : null,
      });
    },
    onError: (_error, outfit) => {
      patchOutfitEverywhere(queryClient, outfit.key, { saved: outfit.saved, savedId: outfit.savedId });
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.outfits.savedAll });
      void queryClient.invalidateQueries({ queryKey: queryKeys.homeAll });
    },
  });
}

/** Toggle a garment's favorite flag (PUT /api/garments/{id}/favorite). */
export function useToggleGarmentFavorite() {
  const queryClient = useQueryClient();
  const patchAll = (id: number, patch: Partial<Garment>) => {
    for (const root of [queryKeys.garments.all, queryKeys.homeAll, queryKeys.outfits.all]) {
      queryClient.setQueriesData({ queryKey: root }, (data: unknown) => patchGarmentsInData(data, id, patch));
    }
  };
  return useMutation({
    mutationFn: (garment: Pick<Garment, 'id' | 'favorite'>) => api.setGarmentFavorite(garment.id, !garment.favorite),
    onMutate: (garment) => patchAll(garment.id, { favorite: !garment.favorite }),
    onSuccess: (updated) => patchAll(updated.id, updated),
    onError: (_e, garment) => patchAll(garment.id, { favorite: garment.favorite }),
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.homeAll });
      void queryClient.invalidateQueries({ queryKey: queryKeys.garments.lists });
    },
  });
}

export function useCreateGarment() {
  const queryClient = useQueryClient();
  const { language } = useLanguage();
  return useMutation({
    mutationFn: (body: GarmentRequest) => api.createGarment(body),
    onSuccess: (garment) => {
      queryClient.setQueryData(queryKeys.garments.detail(garment.id, language), garment);
      void invalidateWardrobe(queryClient);
    },
  });
}

export function useUpdateGarment(id: number) {
  const queryClient = useQueryClient();
  const { language } = useLanguage();
  return useMutation({
    mutationFn: (body: GarmentRequest) => api.updateGarment(id, body),
    onSuccess: (garment) => {
      queryClient.setQueryData(queryKeys.garments.detail(garment.id, language), garment);
      void invalidateWardrobe(queryClient);
    },
  });
}

export function useDeleteGarment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => api.deleteGarment(id),
    onSuccess: (_void, id) => {
      queryClient.removeQueries({ queryKey: queryKeys.garments.detailAll(id) });
      queryClient.removeQueries({ queryKey: queryKeys.garments.pairingsAll(id) });
      void invalidateWardrobe(queryClient);
    },
  });
}

export function useUpdateMe() {
  const { setUser } = useSession();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: UpdateMeRequest) => api.updateMe(body),
    onSuccess: (user) => {
      setUser(user);
      // Style preferences influence scoring → refresh suggestions.
      void queryClient.invalidateQueries({ queryKey: queryKeys.outfits.all });
      void queryClient.invalidateQueries({ queryKey: queryKeys.homeAll });
    },
  });
}

/**
 * In-app account deletion (App Store 5.1.1(v) / Google Play): provider cleanup (Apple re-auth + token
 * revocation, Google revoke) → `DELETE /api/me { reason }` → sign out with the "account deleted" notice.
 * Resolves `false` when the user cancelled the Apple re-authentication (nothing was deleted).
 */
export function useDeleteAccount() {
  const { signOut, user } = useSession();
  return useMutation<boolean, unknown, { reason: string | null }>({
    mutationFn: async ({ reason }) => {
      const proceed = await prepareAccountDeletion(user?.authProvider ?? null);
      if (!proceed) return false;
      await api.deleteMe(reason);
      return true;
    },
    onSuccess: async (deleted) => {
      if (deleted) await signOut({ notice: { kind: 'deleted' } });
    },
  });
}

/** Public deletion request for users who cannot sign in (`POST /api/account-deletion-requests`). */
export function useDeletionRequest() {
  return useMutation({
    mutationFn: (body: { email: string; message: string | null }) => api.createDeletionRequest(body),
  });
}
