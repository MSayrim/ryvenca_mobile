# RYVENCA — client product & design spec (web + mobile)

RYVENCA is a digital wardrobe + outfit suggestion app. Tagline: "Style what you already own."
Core promise (Turkish UI): "Yeni kıyafet satın almadan önce, dolabındaki parçaları daha iyi kullan."
Users upload ordinary phone photos of their own clothes (on a hanger, bed, sofa, floor…). The app
organizes them and suggests outfits built ONLY from the user's own garments, with a 0–100 "Uyum Skoru"
and a "Neden Uyumlu?" explanation. All UI copy is Turkish. No shopping, no social, no try-on.

The backend contract is in `/home/user/ryvenca_backend/docs/API.md` — follow it exactly. All enum labels
come from `GET /api/meta` (fetch once, cache for the session). Image URLs in responses are absolute.

## Visual language (premium editorial fashion assistant, NOT an e-commerce look)

Design tokens (use exactly these names/values in a theme file):

```
colors:
  background   #FAF7F2   warm white page background
  surface      #FFFDF9   cards
  surfaceAlt   #F2EDE5   stat cards, inactive chips, secondary buttons
  cream        #EFE7DB
  beige        #D9CBB6
  sand         #C4B196
  softBrown    #8B6F55
  brown        #5C4433
  ink          #2A201B   primary buttons, active chip, headings (espresso charcoal)
  text         #231B16
  textSecondary#6F655C
  textMuted    #9A9087
  border       #E7DFD3
  divider      #EEE8DF
  success      #3F5A3A   on successBg #E4EADF   (the "Uyum %92" pill with a ✦ sparkle icon)
  danger       #A4453A
  overlay      rgba(42,32,27,0.55)
radius: sm 10, md 14, lg 20, xl 28, pill 999
spacing scale: 4, 8, 12, 16, 20, 24, 32, 40
fonts:
  display: "Fraunces" (serif; headings, wordmark, big numbers). Wordmark "RYVENCA" = Fraunces 500, letter-spacing ~0.28em.
  body:    "Inter" (400/500/600)
  script:  "Caveat" — ONLY for small hand-written accents (1 per screen max), e.g. "Stüdyo çekimi gerekmez. Kendi fotoğrafın yeterli! ♡"
type scale: display 34/38, h1 28, h2 22, h3 18, body 15, small 13, caption 11 (uppercase tracking for eyebrow labels)
```

Icons: thin line icons (1.5px stroke), e.g. lucide. Hanger icon is the brand motif (Dolabım tab, empty states).

### The most important design rule — heterogeneous real photos
Users' photos have different backgrounds and lighting. Never pretend they are catalog shots, never remove
backgrounds. Harmonize instead:
- Always show photos inside fixed-ratio frames (4:5 for garment cards, square/tall tiles in collages) with
  `object-fit: cover` / `resizeMode="cover"`, radius md, and a 1px `border` hairline.
- Apply a subtle unified "warm grade" over every garment photo: a very light overlay
  (`rgba(139,111,85,0.06)`, on web `mix-blend-mode: multiply`) plus on web `filter: saturate(0.94) contrast(1.02)`.
  This makes photos from different rooms read as one set.
- While loading, show a `cream` placeholder with the hanger icon (no layout shift).
- Each garment card shows a small color dot (garment `colorHex`) with a white 2px ring in a corner.

### Outfit collage ("mood board")
A reusable component that lays out 3–7 outfit items as an editorial collage, used on cards and detail:
- The "hero" item (OUTERWEAR if present, else DRESS, else TOP) takes a large tile on the left (~60% width, tall).
- The remaining items stack in a right column of smaller tiles (2–3 per column; if more, a second row
  under the hero). Gap 4–6px, outer radius lg, inner tiles radius sm.
- Works gracefully for 3 items (hero + 2) up to 7.

### Score visual
"Uyum Skoru" shown as a circular ring (stroke in `ink` on `beige` track) with the number in Fraunces.
In cards use the compact pill: ✦ "Uyum %92" on successBg.

## Screens

Navigation: 5 bottom tabs — Ana Sayfa (home icon), Dolabım (hanger), Yükle (center, raised round `ink` button
with "+"), Öneriler (lightbulb), Profil (user). On web ≥ 900px wide use a slim left sidebar or top bar with
the same 5 destinations instead of bottom tabs; content max-width ~1120px; grids get more columns.

Header on main tabs: hanger icon (left, links to Dolabım) · centered wordmark "RYVENCA" + small tagline
"Style what you already own" · search icon (opens wardrobe search) on the right.
(No notification bell — there is no notification feature in the MVP; do not add dead buttons.)

1. **Auth** — Login / Register. Editorial split: wordmark, tagline, short value proposition
   ("Yeni kıyafet almadan önce, dolabındakileri yeniden keşfet."). Email, password, (register: name).
   Show API error `message`. Store JWT (web: localStorage; mobile: expo-secure-store). On 401 anywhere → log out.

2. **Onboarding** (after register while `user.onboardingCompleted == false`), 3 steps with progress dots:
   a) "Dolabını kime göre düzenleyelim?" → wardrobeType (Kadın / Erkek / Unisex) as large selectable cards.
   b) "Stilini nasıl tanımlarsın?" → multi-select style chips (from meta.styles, with descriptions), min 1.
   c) "Nasıl çalışır?" → 3 short steps (Fotoğrafını çek · Dolabın düzenlensin · Kombinini keşfet) + CTA
      "İlk parçanı ekle" (→ Upload) and a secondary "Daha sonra". Both call `PUT /api/me` with
      `onboardingCompleted: true`.

3. **Ana Sayfa** (`GET /api/home`)
   - Hero card (surfaceAlt/cream bg, radius lg): eyebrow in script font "Aynı sen, daha iyi kombinler ♡",
     title "Bugün ne giysem?" (Fraunces, display), text "Dolabındaki gerçek parçalarla sana en uygun
     kombinleri önerelim.", CTA pill "Kombin Öner →" (→ Öneriler with a fresh random seed).
     Right side of the hero: a fanned/overlapping stack of 3 of the user's own recent garment thumbnails
     (slight rotations −6°, 0°, 5°, white 4px photo borders, soft shadow) — NOT a stock photo. If the
     wardrobe is empty show a line-art hanger illustration instead.
   - 3 stat cards in a row: Ürünlerim (garmentCount, hanger icon) · Hazır Kombin (readyOutfitCount, layers icon)
     · Favoriler (favoriteCount, heart icon). Tapping navigates to Dolabım / Öneriler / Favoriler.
   - Readiness banner if `readiness.ready == false` or garmentCount < recommendedMinimum: friendly progress
     ("Kombin önerileri için 5–10 parça ekle · 3/8") + list of missing messages + "Parça Ekle" button.
   - "Dolabım" section header with "Tümünü Gör →"; category chips (Üst, Alt, Ceket, Elbise, Ayakkabı, Çanta,
     Aksesuar) filtering a horizontal row of recent garment thumbnails (from recentGarments; client-side filter).
   - "Bugünün Önerileri" with "Tümünü Gör →": outfit cards (collage, title, description, heart/save toggle,
     "Bu Kombini Kaydet" button, tap → detail). Horizontal scroll on mobile, grid on web.

4. **Dolabım** (`GET /api/garments`)
   - Title "Dolabım" + count, search field, filter chips row for category (Tümü + 7 categories), and a
     "Filtrele" sheet/popover for color (swatches), season, occasion, "Sadece favoriler".
   - 2-column grid (web: 3–5 columns) of garment cards: 4:5 photo, color dot, heart toggle
     (`PUT /api/garments/{id}/favorite`), displayName, subcategory label · color label.
   - Empty state with hanger illustration + "İlk parçanı ekle".

5. **Parça Detayı** (garment detail, `GET /api/garments/{id}` + `/pairings`)
   - Large photo, name, chips for category/subcategory/color/seasons/occasions, favorite toggle,
     "Düzenle" (reuse the upload form in edit mode, `PUT`), "Sil" (confirm: "Bu parçayı içeren kayıtlı
     kombinler de silinecek.").
   - **"Bununla Ne Gider?"** section — the key feature: for each role in `matches` a horizontal row of
     the best matching items with a small score badge; then "Bu parçayla kombinler" = `outfits` as cards.
     If readiness is not ready, show what's missing.

6. **Yükle** (Kıyafet Yükle)
   - Title "Kıyafet Yükle", subtitle "Dolabına yeni bir parça ekle, daha güzel kombinler keşfet."
   - Photo card: preview area (4:5) + "Kıyafetinin fotoğrafını ekle" + helper "Normal telefon fotoğrafın
     yeterli. Kıyafetinin tümünü, iyi ışıkta ve mümkünse düz bir zeminde çek." + buttons "Kameradan Çek" and
     "Galeriden Seç" (web: one file input with `accept="image/*"` and `capture` variant for camera). Script
     accent "Stüdyo çekimi gerekmez. Kendi fotoğrafın yeterli! ♡".
   - Client-side: downscale to max 1600px long edge, JPEG ~0.85 before upload (web: canvas; mobile:
     expo-image-manipulator). Then `POST /api/images` immediately; show an "analyzing" shimmer.
   - After detection: the color row pre-selects `detection.color` with a small label "Otomatik algılandı"
     (+ confidence as "yüksek/orta/düşük güven"); other candidates are hinted. User can pick any of the 17
     swatches (manual override is a MUST). Show the measured `detection.hex` as a tiny swatch "Algılanan ton".
   - Form: Kategori chips (7) → Alt kategori chips (filtered by category, required) → Renk swatches (17, circle
     with ring when selected, label under selected) → "Desenli" toggle → Mevsim chips (multi: İlkbahar, Yaz,
     Sonbahar, Kış + "Tüm Mevsimler" shortcut) → Kullanım alanı chips (multi) → optional İsim.
   - Sticky bottom primary button "Dolaba Kaydet" (disabled until photo uploaded + category + subcategory +
     color). After save: toast "Dolabına eklendi" and offer "Bir parça daha ekle" / "Parçayı gör".
   - "Son Eklenenler" row at the bottom (recent garments).

7. **Öneriler** (`GET /api/outfits/suggestions`)
   - Title "Öneriler", subtitle "Dolabındaki fotoğraflarla hazırlanan kombinler."
   - Filter chips: Tümü, Günlük (DAILY), Ofis (OFFICE), Akşam (EVENING), Hafta Sonu (WEEKEND), Spor (SPORT).
   - Season selector (small dropdown/segmented, defaults to the season returned by the API).
   - "Yeniden Öner" / shuffle button → new random seed.
   - Outfit cards (large, editorial): left column title (Fraunces), description, ✦ "Uyum %92" pill,
     "Detayı Gör →" (ink) and "Kaydet"/"Kaydedildi" (surfaceAlt, bookmark icon); right side = collage.
     On narrow screens stack collage above text.
   - Not-ready state: explain what's missing with CTA to upload.

8. **Kombin Detayı** (`GET /api/outfits/evaluate?items=…`)
   - Header: back, title "Kombin Detayı", share (web: navigator.share / copy; mobile: Share API with text), bookmark.
   - Summary card: title (Fraunces display), description, score ring "Uyum Skoru 94".
   - Large collage of the items (tap an item → garment detail).
   - Score breakdown: 5 thin bars (label, weight %, score).
   - "Neden Uyumlu?" — 3 cards (icon + title + text) from `reasons` (COLOR → palette icon, TEXTURE → layers,
     OCCASION → calendar, SEASON → sun/leaf, STYLE → sparkles).
   - "Uygun Ortamlar" — chips from `venues`.
   - "Renk Paleti" — circles from `palette` (+ paletteName in small caps if present).
   - Buttons: "Kombini Kaydet"/"Kaydedildi" (POST/DELETE saved) and "Benzer Kombinler" (scroll to / load
     `/api/outfits/similar` list below).

9. **Favoriler** — tabs "Kaydedilen Kombinler" (`GET /api/outfits/saved`) and "Favori Parçalar"
   (`GET /api/garments?favorite=true`). Reachable from home stat card and from Profil.

10. **Profil** — avatar initial circle, name, email; wardrobe type + style preferences editable (same controls
    as onboarding, `PUT /api/me`); links: Favorilerim, Dolap istatistikleri (counts per category from garments),
    "Nasıl çalışır?"; "Çıkış Yap"; "Hesabı Sil" (confirm, `DELETE /api/me`).

## Engineering expectations
- TypeScript strict. Typed API client module mirroring API.md types. One place for base URL config.
- Data fetching with @tanstack/react-query (invalidate garments/home/suggestions/saved after mutations).
- Loading skeletons (cream blocks), empty states, error states with retry. No dead buttons.
- Accessibility: labels on icon buttons, sufficient contrast, 44px touch targets.
- Keep components small and reusable: GarmentPhoto, GarmentCard, OutfitCollage, OutfitCard, ScorePill,
  ScoreRing, Chip, ColorSwatch, SectionHeader, EmptyState, PrimaryButton, SecondaryButton.
