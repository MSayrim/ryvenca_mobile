/**
 * Types mirroring docs/API.md (RYVENCA API v1). Keep in sync with the backend contract.
 */

// ---------- Enums ----------

export type WardrobeType = 'WOMEN' | 'MEN' | 'UNISEX';

export type StylePreference =
  | 'CASUAL'
  | 'SMART_CASUAL'
  | 'MINIMAL'
  | 'CLASSIC'
  | 'STREETWEAR'
  | 'BUSINESS'
  | 'SPORT';

export type Category = 'TOP' | 'BOTTOM' | 'OUTERWEAR' | 'DRESS' | 'SHOES' | 'BAG' | 'ACCESSORY';

/** Subcategory codes are open-ended; the authoritative list comes from `/api/meta`. */
export type Subcategory = string;

export type ColorName =
  | 'BLACK'
  | 'WHITE'
  | 'GRAY'
  | 'CREAM'
  | 'BEIGE'
  | 'BROWN'
  | 'NAVY'
  | 'BLUE'
  | 'LIGHT_BLUE'
  | 'GREEN'
  | 'OLIVE'
  | 'RED'
  | 'BURGUNDY'
  | 'ORANGE'
  | 'YELLOW'
  | 'PINK'
  | 'PURPLE';

export type Season = 'SPRING' | 'SUMMER' | 'AUTUMN' | 'WINTER';

export type Occasion = 'DAILY' | 'OFFICE' | 'EVENING' | 'WEEKEND' | 'SPORT';

export type OutfitRole = 'OUTERWEAR' | 'TOP' | 'DRESS' | 'BOTTOM' | 'SHOES' | 'BAG' | 'ACCESSORY';

export type ColorSource = 'AUTO' | 'MANUAL';

export type ApiErrorCode =
  | 'VALIDATION_ERROR'
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'CONFLICT'
  | 'INVALID_IMAGE'
  | 'PAYLOAD_TOO_LARGE'
  | 'ACCOUNT_DISABLED'
  | 'LOCAL_AUTH_DISABLED'
  | 'AUTH_UNAVAILABLE'
  | 'INTERNAL_ERROR';

// ---------- Errors ----------

export interface ApiErrorBody {
  status: number;
  error: ApiErrorCode | string;
  message: string;
  fieldErrors?: Record<string, string> | null;
}

// ---------- Meta ----------

export interface LabeledCode<C extends string = string> {
  code: C;
  label: string;
}

export interface StyleMeta extends LabeledCode<StylePreference> {
  description: string;
}

export interface CategoryMeta extends LabeledCode<Category> {
  pluralLabel: string;
  subcategories: LabeledCode<Subcategory>[];
}

export interface ColorMeta extends LabeledCode<ColorName> {
  hex: string;
}

/** `GET /api/meta` → `languages` (native labels). Optional: older servers do not send it. */
export interface LanguageMeta {
  code: string;
  label: string;
  rtl: boolean;
}

export interface Meta {
  languages?: LanguageMeta[];
  wardrobeTypes: LabeledCode<WardrobeType>[];
  styles: StyleMeta[];
  categories: CategoryMeta[];
  colors: ColorMeta[];
  seasons: LabeledCode<Season>[];
  occasions: LabeledCode<Occasion>[];
}

// ---------- Auth / User ----------

export type UserRole = 'USER' | 'ADMIN';

/** How the account signs in (server side). `LOCAL` = legacy e-mail/password against the backend. */
export type AuthProviderType = 'APPLE' | 'GOOGLE' | 'PASSWORD' | 'LOCAL';

export interface User {
  id: number;
  email: string;
  displayName: string;
  wardrobeType: WardrobeType | null;
  /** Preferred UI language code (e.g. "tr", "ar"); null/absent when never set. */
  language?: string | null;
  stylePreferences: StylePreference[];
  onboardingCompleted: boolean;
  createdAt: string;
  /** Optional: older servers do not send these. */
  role?: UserRole;
  authProvider?: AuthProviderType;
  emailVerified?: boolean;
}

export interface AuthResponse {
  token: string;
  expiresAt: string;
  user: User;
}

export interface RegisterRequest {
  email: string;
  password: string;
  displayName: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

/** `POST /api/auth/firebase` — exchanges a Firebase ID token for a RYVENCA token. */
export interface FirebaseSignInRequest {
  idToken: string;
  /** Only used when the server creates the user and the token carries no name (Apple first sign-in). */
  displayName: string | null;
}

export interface DeleteMeRequest {
  reason: string | null;
}

/** `POST /api/account-deletion-requests` (public). */
export interface DeletionRequestBody {
  email: string;
  message: string | null;
}

export interface DeletionRequestResponse {
  reference: string;
}

/** Only non-null fields are applied by the backend. */
export interface UpdateMeRequest {
  displayName?: string | null;
  wardrobeType?: WardrobeType | null;
  stylePreferences?: StylePreference[] | null;
  onboardingCompleted?: boolean | null;
  language?: string | null;
}

// ---------- Public app configuration (`GET /api/config`) ----------

export interface AuthProviderFlags {
  apple: boolean;
  google: boolean;
  email: boolean;
}

export interface FirebaseWebConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  appId: string;
  messagingSenderId: string;
  storageBucket: string;
}

export interface AppLinks {
  privacyPolicy: string | null;
  terms: string | null;
  support: string | null;
  supportEmail: string | null;
  accountDeletion: string | null;
  appStore: string | null;
  playStore: string | null;
}

export interface AppConfig {
  auth: {
    /** The server can verify Firebase ID tokens. */
    firebase: boolean;
    /** Legacy e-mail/password (`/api/auth/login|register`) is allowed. */
    local: boolean;
    providers: AuthProviderFlags;
  };
  firebaseWeb: FirebaseWebConfig | null;
  links: AppLinks;
  maintenance: { enabled: boolean; message: string | null };
  minVersion: { ios: string | null; android: string | null };
}

// ---------- Images ----------

export interface ColorCandidate {
  color: ColorName;
  hex: string;
  score: number;
}

export interface ColorDetection {
  color: ColorName;
  /** Measured garment color. */
  hex: string;
  confidence: number;
  /** Candidate `hex` values are the canonical swatches. */
  candidates: ColorCandidate[];
  /** When true the upload form pre-toggles "Desenli" (user can still change it). */
  patternLikely: boolean;
}

export interface ImageUpload {
  imageId: string;
  imageUrl: string;
  thumbnailUrl: string;
  width: number;
  height: number;
  detection: ColorDetection;
}

// ---------- Garments ----------

export interface Garment {
  id: number;
  name: string | null;
  /** name, or generated "<Renk> <Alt kategori>" */
  displayName: string;
  category: Category;
  subcategory: Subcategory;
  color: ColorName;
  colorHex: string;
  colorSource: ColorSource;
  pattern: boolean;
  seasons: Season[];
  occasions: Occasion[];
  favorite: boolean;
  imageId: string;
  imageUrl: string;
  thumbnailUrl: string;
  createdAt: string;
  updatedAt: string;
}

export interface GarmentRequest {
  /** Required on create; optional on update (replaces the photo). */
  imageId?: string | null;
  name: string | null;
  category: Category;
  subcategory: Subcategory;
  color: ColorName;
  colorHex: string | null;
  pattern: boolean;
  seasons: Season[];
  occasions: Occasion[];
}

export interface GarmentFilters {
  category?: Category[];
  color?: ColorName[];
  season?: Season[];
  occasion?: Occasion[];
  favorite?: boolean;
  q?: string;
}

export interface PairingMatchItem {
  garment: Garment;
  score: number;
}

export interface PairingMatch {
  role: OutfitRole;
  label: string;
  items: PairingMatchItem[];
}

export interface PairingsResponse {
  anchor: Garment;
  matches: PairingMatch[];
  outfits: Outfit[];
  readiness: Readiness;
}

// ---------- Outfits ----------

export type BreakdownCode = 'COLOR' | 'CATEGORY' | 'SEASON' | 'OCCASION' | 'STYLE';

export interface ScoreBreakdownItem {
  code: BreakdownCode | string;
  label: string;
  weight: number;
  score: number;
}

export type ReasonCode = 'COLOR' | 'TEXTURE' | 'OCCASION' | 'SEASON' | 'STYLE';

export interface OutfitReason {
  code: ReasonCode | string;
  title: string;
  text: string;
}

export interface OutfitItem {
  role: OutfitRole;
  garment: Garment;
}

export interface PaletteEntry {
  color: ColorName;
  label: string;
  hex: string;
}

export interface Outfit {
  /** Sorted garment ids, stable identity of an outfit. */
  key: string;
  title: string;
  description: string;
  score: number;
  breakdown: ScoreBreakdownItem[];
  style: StylePreference;
  styleLabel: string;
  primaryOccasion: Occasion;
  occasions: Occasion[];
  venues: string[];
  /** Display order: OUTERWEAR, TOP, DRESS, BOTTOM, SHOES, BAG, ACCESSORY */
  items: OutfitItem[];
  palette: PaletteEntry[];
  paletteName: string | null;
  reasons: OutfitReason[];
  saved: boolean;
  savedId: number | null;
}

export interface MissingItem {
  category: Category;
  message: string;
}

export interface Readiness {
  ready: boolean;
  garmentCount: number;
  recommendedMinimum: number;
  missing: MissingItem[];
}

export interface SuggestionsParams {
  occasion?: Occasion | null;
  season?: Season | null;
  limit?: number;
  seed?: number | null;
}

export interface SuggestionsResponse {
  outfits: Outfit[];
  readiness: Readiness;
  season: Season;
  occasion: Occasion | null;
}

export interface SimilarResponse {
  outfits: Outfit[];
}

export interface SaveOutfitRequest {
  garmentIds: number[];
  title: string | null;
}

// ---------- Home ----------

export interface HomeStats {
  garmentCount: number;
  readyOutfitCount: number;
  favoriteCount: number;
}

export interface HomeResponse {
  stats: HomeStats;
  recentGarments: Garment[];
  todaysSuggestions: Outfit[];
  readiness: Readiness;
  season: Season;
}
