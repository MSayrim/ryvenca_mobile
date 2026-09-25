import { Platform } from 'react-native';

import { UPLOAD_TIMEOUT_MS } from '../config';
import { request } from './client';
import type {
  AuthResponse,
  Garment,
  GarmentFilters,
  GarmentRequest,
  HomeResponse,
  ImageUpload,
  LoginRequest,
  Meta,
  Occasion,
  Outfit,
  PairingsResponse,
  RegisterRequest,
  SaveOutfitRequest,
  Season,
  SimilarResponse,
  SuggestionsParams,
  SuggestionsResponse,
  UpdateMeRequest,
  User,
} from './types';

// ---------- Meta ----------
export const getMeta = () => request<Meta>('/api/meta', { auth: false });

// ---------- Auth ----------
export const register = (body: RegisterRequest) =>
  request<AuthResponse>('/api/auth/register', { method: 'POST', body, auth: false });

export const login = (body: LoginRequest) =>
  request<AuthResponse>('/api/auth/login', { method: 'POST', body, auth: false });

// ---------- Me ----------
export const getMe = () => request<User>('/api/me');
export const updateMe = (body: UpdateMeRequest) => request<User>('/api/me', { method: 'PUT', body });
export const deleteMe = () => request<void>('/api/me', { method: 'DELETE' });

// ---------- Images ----------
export interface LocalImageFile {
  uri: string;
  /** e.g. image/jpeg */
  mimeType: string;
  fileName: string;
}

async function buildImageFormData(file: LocalImageFile): Promise<FormData> {
  const form = new FormData();
  if (Platform.OS === 'web') {
    // On web the picker/manipulator return blob: or data: URIs — convert to a real Blob.
    const blob = await (await fetch(file.uri)).blob();
    form.append('file', blob, file.fileName);
  } else {
    // React Native's FormData accepts { uri, name, type } file descriptors.
    const descriptor = { uri: file.uri, name: file.fileName, type: file.mimeType };
    form.append('file', descriptor as unknown as Blob);
  }
  return form;
}

export async function uploadImage(file: LocalImageFile): Promise<ImageUpload> {
  const formData = await buildImageFormData(file);
  return request<ImageUpload>('/api/images', { method: 'POST', formData, timeoutMs: UPLOAD_TIMEOUT_MS });
}

// ---------- Garments ----------
export const getGarments = (filters: GarmentFilters = {}) =>
  request<Garment[]>('/api/garments', {
    query: {
      category: filters.category,
      color: filters.color,
      season: filters.season,
      occasion: filters.occasion,
      favorite: filters.favorite ? true : undefined,
      q: filters.q?.trim() || undefined,
    },
  });

export const getGarment = (id: number) => request<Garment>(`/api/garments/${id}`);

export const createGarment = (body: GarmentRequest) =>
  request<Garment>('/api/garments', { method: 'POST', body });

export const updateGarment = (id: number, body: GarmentRequest) =>
  request<Garment>(`/api/garments/${id}`, { method: 'PUT', body });

export const deleteGarment = (id: number) => request<void>(`/api/garments/${id}`, { method: 'DELETE' });

export const setGarmentFavorite = (id: number, favorite: boolean) =>
  request<Garment>(`/api/garments/${id}/favorite`, { method: 'PUT', body: { favorite } });

export const getPairings = (id: number, params: { season?: Season | null; occasion?: Occasion | null } = {}) =>
  request<PairingsResponse>(`/api/garments/${id}/pairings`, {
    query: { season: params.season, occasion: params.occasion },
  });

// ---------- Outfits ----------
export const getSuggestions = (params: SuggestionsParams = {}) =>
  request<SuggestionsResponse>('/api/outfits/suggestions', {
    query: { occasion: params.occasion, season: params.season, limit: params.limit, seed: params.seed },
  });

export const evaluateOutfit = (garmentIds: readonly number[]) =>
  request<Outfit>('/api/outfits/evaluate', { query: { items: garmentIds } });

export const getSimilarOutfits = (garmentIds: readonly number[], limit = 6) =>
  request<SimilarResponse>('/api/outfits/similar', { query: { items: garmentIds, limit } });

export const getSavedOutfits = () => request<Outfit[]>('/api/outfits/saved');

export const saveOutfit = (body: SaveOutfitRequest) =>
  request<Outfit>('/api/outfits/saved', { method: 'POST', body });

export const deleteSavedOutfit = (savedId: number) =>
  request<void>(`/api/outfits/saved/${savedId}`, { method: 'DELETE' });

// ---------- Home ----------
export const getHome = () => request<HomeResponse>('/api/home');
