import * as ImagePicker from 'expo-image-picker';
import { Check, Eye, Plus } from 'lucide-react-native';
import { useCallback, useMemo, useState, type ReactNode } from 'react';
import { FlatList, KeyboardAvoidingView, Linking, Platform, ScrollView, StyleSheet, Switch, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ApiError, api, errorMessage } from '../../api';
import type { Category, ColorName, Garment, GarmentRequest, ImageUpload, Occasion, Season } from '../../api/types';
import {
  AppHeader,
  BottomSheet,
  Chip,
  ColorSwatch,
  ErrorState,
  GarmentPhoto,
  GarmentThumb,
  PrimaryButton,
  Screen,
  ScreenHeader,
  SecondaryButton,
  SectionHeader,
  Skeleton,
  TextField,
  Typography,
  useToast,
} from '../../components';
import { useCreateGarment, useUpdateGarment } from '../../hooks/mutations';
import { useGarment, useHome } from '../../hooks/queries';
import { useMeta } from '../../hooks/useMeta';
import type { RootScreenProps, TabScreenProps } from '../../navigation/types';
import { colors, radius, spacing } from '../../theme';
import { confirm, notify } from '../../utils/confirm';
import { prepareImageForUpload } from '../../utils/image';
import { confidenceLabel, subcategoriesFor, toggleInList } from '../../utils/labels';
import { PhotoPicker, type UploadStatus } from './PhotoPicker';

// ---------------------------------------------------------------------------
// Screens
// ---------------------------------------------------------------------------

/** Tab: "Kıyafet Yükle" (create mode). */
export function UploadScreen({ navigation }: TabScreenProps<'Upload'>) {
  const [formKey, setFormKey] = useState(0);
  const [saved, setSaved] = useState<Garment | null>(null);
  const home = useHome();
  const toast = useToast();

  return (
    <Screen>
      <AppHeader
        onPressHanger={() => navigation.navigate('Wardrobe', undefined)}
        onPressSearch={() => navigation.navigate('Wardrobe', { focusSearch: Date.now() })}
      />
      <GarmentForm
        key={formKey}
        mode="create"
        onSaved={(g) => {
          toast.show('Dolabına eklendi');
          setSaved(g);
        }}
        header={
          <View style={styles.titleBlock}>
            <Typography variant="h1" accessibilityRole="header">
              Kıyafet Yükle
            </Typography>
            <Typography variant="body" color={colors.textSecondary}>
              Dolabına yeni bir parça ekle, daha güzel kombinler keşfet.
            </Typography>
          </View>
        }
        footer={
          (home.data?.recentGarments.length ?? 0) > 0 ? (
            <View style={styles.recent}>
              <SectionHeader title="Son Eklenenler" actionLabel="Tümünü Gör →" onAction={() => navigation.navigate('Wardrobe', undefined)} />
              <FlatList
                horizontal
                data={home.data?.recentGarments ?? []}
                keyExtractor={(g) => String(g.id)}
                showsHorizontalScrollIndicator={false}
                style={styles.bleed}
                contentContainerStyle={styles.hList}
                renderItem={({ item }) => (
                  <GarmentThumb garment={item} width={92} onPress={() => navigation.navigate('GarmentDetail', { id: item.id })} />
                )}
              />
            </View>
          ) : null
        }
      />

      <BottomSheet visible={!!saved} onClose={() => { setSaved(null); setFormKey((k) => k + 1); }} title="Dolabına eklendi">
        {saved ? (
          <View style={styles.savedBody}>
            <View style={styles.savedPhoto}>
              <GarmentPhoto uri={saved.thumbnailUrl} colorHex={saved.colorHex} />
            </View>
            <View style={styles.flex}>
              <View style={styles.savedCheck}>
                <Check size={16} color={colors.success} strokeWidth={2} />
                <Typography variant="smallMedium" color={colors.success}>
                  Kaydedildi
                </Typography>
              </View>
              <Typography variant="h2">{saved.displayName}</Typography>
              <Typography variant="small">Harika! Yeni parçan artık kombin önerilerinde.</Typography>
            </View>
          </View>
        ) : null}
        <View style={styles.savedActions}>
          <PrimaryButton
            label="Bir parça daha ekle"
            icon={Plus}
            onPress={() => {
              setSaved(null);
              setFormKey((k) => k + 1);
            }}
            fullWidth
          />
          <SecondaryButton
            label="Parçayı gör"
            icon={Eye}
            onPress={() => {
              const id = saved?.id;
              setSaved(null);
              setFormKey((k) => k + 1);
              if (id != null) navigation.navigate('GarmentDetail', { id });
            }}
            fullWidth
          />
        </View>
      </BottomSheet>
    </Screen>
  );
}

/** Stack: edit an existing garment (same form, PUT). */
export function GarmentEditScreen({ navigation, route }: RootScreenProps<'GarmentEdit'>) {
  const garment = useGarment(route.params.id);
  const toast = useToast();
  return (
    <Screen>
      <ScreenHeader title="Parçayı Düzenle" onBack={() => navigation.goBack()} />
      {garment.isLoading ? (
        <View style={styles.loadingPad}>
          <Skeleton height={undefined} radius={radius.lg} style={styles.photoSkeleton} />
        </View>
      ) : garment.isError || !garment.data ? (
        <ErrorState error={garment.error} onRetry={() => void garment.refetch()} />
      ) : (
        <GarmentForm
          mode="edit"
          garment={garment.data}
          onSaved={() => {
            toast.show('Değişiklikler kaydedildi');
            navigation.goBack();
          }}
        />
      )}
    </Screen>
  );
}

// ---------------------------------------------------------------------------
// Form
// ---------------------------------------------------------------------------

interface GarmentFormProps {
  mode: 'create' | 'edit';
  garment?: Garment;
  onSaved: (garment: Garment) => void;
  header?: ReactNode;
  footer?: ReactNode;
}

function GarmentForm({ mode, garment, onSaved, header, footer }: GarmentFormProps) {
  const insets = useSafeAreaInsets();
  const { meta, labels } = useMeta();
  const create = useCreateGarment();
  const update = useUpdateGarment(garment?.id ?? 0);
  const save = mode === 'create' ? create : update;

  const [status, setStatus] = useState<UploadStatus>('idle');
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [localPreview, setLocalPreview] = useState<string | null>(null);
  const [upload, setUpload] = useState<ImageUpload | null>(null);
  const [lastSource, setLastSource] = useState<'camera' | 'library' | null>(null);

  const [category, setCategory] = useState<Category | null>(garment?.category ?? null);
  const [subcategory, setSubcategory] = useState<string | null>(garment?.subcategory ?? null);
  const [color, setColor] = useState<ColorName | null>(garment?.color ?? null);
  const [pattern, setPattern] = useState<boolean>(garment?.pattern ?? false);
  const [seasons, setSeasons] = useState<Season[]>(garment?.seasons ?? []);
  const [occasions, setOccasions] = useState<Occasion[]>(garment?.occasions ?? []);
  const [name, setName] = useState<string>(garment?.name ?? '');

  const subcategories = useMemo(() => subcategoriesFor(meta, category), [meta, category]);
  const allSeasonCodes = useMemo(() => (meta?.seasons ?? []).map((s) => s.code), [meta]);
  const allSeasonsSelected = allSeasonCodes.length > 0 && allSeasonCodes.every((s) => seasons.includes(s));

  const selectCategory = (next: Category) => {
    if (next !== category) setSubcategory(null);
    setCategory(next);
  };

  const pickImage = useCallback(
    async (source: 'camera' | 'library') => {
      setLastSource(source);
      try {
        if (source === 'camera' && Platform.OS !== 'web') {
          const permission = await ImagePicker.requestCameraPermissionsAsync();
          if (!permission.granted) {
            const openSettings = await confirm({
              title: 'Kamera izni gerekli',
              message: 'Kıyafetinin fotoğrafını çekebilmek için Ayarlar’dan kamera iznini açabilirsin.',
              confirmText: 'Ayarları Aç',
              cancelText: 'Vazgeç',
            });
            if (openSettings) void Linking.openSettings();
            return;
          }
        }
        const options: ImagePicker.ImagePickerOptions = {
          mediaTypes: ['images'],
          quality: 1,
          allowsEditing: false,
          exif: false,
        };
        const result =
          source === 'camera' ? await ImagePicker.launchCameraAsync(options) : await ImagePicker.launchImageLibraryAsync(options);
        if (result.canceled || !result.assets[0]) return;
        const asset = result.assets[0];

        setUploadError(null);
        setStatus('preparing');
        setLocalPreview(asset.uri);
        const prepared = await prepareImageForUpload({ uri: asset.uri, width: asset.width, height: asset.height });
        setLocalPreview(prepared.uri);

        setStatus('uploading');
        const uploaded = await api.uploadImage(prepared);
        setUpload(uploaded);
        setStatus('done');
        // Pre-select the detected color (user can override any time).
        setColor(uploaded.detection.color);
        if (uploaded.detection.patternLikely) setPattern(true);
      } catch (error) {
        setStatus('error');
        setUploadError(
          error instanceof ApiError ? error.message : 'Fotoğraf yüklenemedi. Lütfen tekrar dene.',
        );
      }
    },
    [],
  );

  const busy = status === 'preparing' || status === 'uploading';
  const hasPhoto = mode === 'edit' ? !busy && status !== 'error' : status === 'done' && !!upload;
  const canSave = hasPhoto && !!category && !!subcategory && !!color && !save.isPending;

  const detection = upload?.detection ?? null;
  const isAutoColor = !!detection && color === detection.color;
  const candidateHints = (detection?.candidates ?? []).filter((c) => c.color !== color);

  const buildRequest = (): GarmentRequest | null => {
    if (!category || !subcategory || !color) return null;
    let colorHex: string | null = null;
    if (upload && color === upload.detection.color) colorHex = upload.detection.hex;
    else if (!upload && garment && color === garment.color) colorHex = garment.colorHex;
    return {
      imageId: upload?.imageId ?? (mode === 'edit' ? undefined : null),
      name: name.trim() ? name.trim() : null,
      category,
      subcategory,
      color,
      colorHex,
      pattern,
      seasons,
      occasions,
    };
  };

  const onSubmit = () => {
    const body = buildRequest();
    if (!body) return;
    save.mutate(body, {
      onSuccess: (g) => onSaved(g),
      onError: (e) => {
        if (!(e instanceof ApiError)) notify('Kaydedilemedi', errorMessage(e));
      },
    });
  };

  const previewUri = localPreview ?? garment?.imageUrl ?? null;
  const fieldErrors = save.error instanceof ApiError ? save.error.fieldErrors : {};

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        {header}
        <PhotoPicker
          previewUri={previewUri}
          status={status}
          errorText={uploadError}
          onCamera={() => void pickImage('camera')}
          onLibrary={() => void pickImage('library')}
          onRetry={lastSource ? () => void pickImage(lastSource) : undefined}
        />

        {/* Kategori */}
        <FormGroup title="Kategori" required error={fieldErrors.category}>
          <View style={styles.wrap}>
            {(meta?.categories ?? []).map((c) => (
              <Chip key={c.code} label={c.label} selected={category === c.code} onPress={() => selectCategory(c.code)} />
            ))}
          </View>
        </FormGroup>

        {/* Alt kategori */}
        <FormGroup title="Alt kategori" required error={fieldErrors.subcategory}>
          {category ? (
            <View style={styles.wrap}>
              {subcategories.map((s) => (
                <Chip key={s.code} label={s.label} selected={subcategory === s.code} onPress={() => setSubcategory(s.code)} />
              ))}
            </View>
          ) : (
            <Typography variant="small">Önce bir kategori seç.</Typography>
          )}
        </FormGroup>

        {/* Renk */}
        <FormGroup title="Renk" required error={fieldErrors.color}>
          {detection ? (
            <View style={styles.detectRow}>
              {isAutoColor ? (
                <View style={styles.autoBadge}>
                  <Typography variant="caption" color={colors.success} style={styles.autoText}>
                    {`✦ Otomatik algılandı · ${confidenceLabel(detection.confidence)}`}
                  </Typography>
                </View>
              ) : (
                <View style={styles.manualBadge}>
                  <Typography variant="caption" color={colors.brown} style={styles.autoText}>
                    Manuel seçildi
                  </Typography>
                </View>
              )}
              <View style={styles.measured}>
                <View style={[styles.measuredSwatch, { backgroundColor: detection.hex }]} />
                <Typography variant="caption">Algılanan ton</Typography>
              </View>
            </View>
          ) : status === 'uploading' ? (
            <Typography variant="small">Renk analiz ediliyor…</Typography>
          ) : null}
          <View style={styles.swatches}>
            {(meta?.colors ?? []).map((c) => (
              <ColorSwatch
                key={c.code}
                hex={c.hex}
                label={c.label}
                selected={color === c.code}
                hinted={candidateHints.some((h) => h.color === c.code)}
                onPress={() => setColor(c.code)}
              />
            ))}
          </View>
          {candidateHints.length > 0 ? (
            <View style={styles.hints}>
              <Typography variant="small">Diğer olasılıklar:</Typography>
              {candidateHints.slice(0, 3).map((h) => (
                <Chip key={h.color} size="sm" tone="outline" label={labels.color(h.color)} onPress={() => setColor(h.color)} />
              ))}
            </View>
          ) : null}
        </FormGroup>

        {/* Desenli */}
        <View style={styles.switchRow}>
          <View style={styles.flex}>
            <Typography variant="bodySemiBold">Desenli</Typography>
            <Typography variant="small">Çizgili, ekose, çiçekli gibi desenler</Typography>
          </View>
          <Switch
            value={pattern}
            onValueChange={setPattern}
            trackColor={{ false: colors.beige, true: colors.ink }}
            thumbColor={colors.surface}
            ios_backgroundColor={colors.beige}
            accessibilityLabel="Desenli"
          />
        </View>

        {/* Mevsim */}
        <FormGroup title="Mevsim" hint="Boş bırakırsan parçaya göre otomatik seçilir.">
          <View style={styles.wrap}>
            {(meta?.seasons ?? []).map((s) => (
              <Chip key={s.code} label={s.label} selected={seasons.includes(s.code)} onPress={() => setSeasons((l) => toggleInList(l, s.code))} />
            ))}
            <Chip
              label="Tüm Mevsimler"
              tone="outline"
              selected={allSeasonsSelected}
              onPress={() => setSeasons(allSeasonsSelected ? [] : allSeasonCodes)}
            />
          </View>
        </FormGroup>

        {/* Kullanım alanı */}
        <FormGroup title="Kullanım alanı" hint="Birden fazla seçebilirsin.">
          <View style={styles.wrap}>
            {(meta?.occasions ?? []).map((o) => (
              <Chip key={o.code} label={o.label} selected={occasions.includes(o.code)} onPress={() => setOccasions((l) => toggleInList(l, o.code))} />
            ))}
          </View>
        </FormGroup>

        {/* İsim */}
        <TextField
          label="İsim (isteğe bağlı)"
          placeholder={
            color && subcategory ? `${labels.color(color)} ${labels.subcategory(subcategory, category ?? undefined)}` : 'Örn. Favori bej blazerım'
          }
          value={name}
          onChangeText={setName}
          maxLength={80}
          returnKeyType="done"
          error={fieldErrors.name}
        />

        {footer}
      </ScrollView>

      {/* Sticky primary action */}
      <View style={[styles.sticky, mode === 'edit' && { paddingBottom: insets.bottom + spacing.sm }]}>
        {save.isError && save.error instanceof ApiError ? (
          <Typography variant="small" color={colors.danger} align="center" accessibilityRole="alert">
            {save.error.message}
          </Typography>
        ) : !canSave && !save.isPending ? (
          <Typography variant="caption" align="center">
            {missingHint({ hasPhoto, busy, category, subcategory, color, mode })}
          </Typography>
        ) : null}
        <PrimaryButton
          label={mode === 'create' ? 'Dolaba Kaydet' : 'Değişiklikleri Kaydet'}
          onPress={onSubmit}
          disabled={!canSave}
          loading={save.isPending}
          fullWidth
        />
      </View>
    </KeyboardAvoidingView>
  );
}

function missingHint(s: {
  hasPhoto: boolean;
  busy: boolean;
  category: Category | null;
  subcategory: string | null;
  color: ColorName | null;
  mode: 'create' | 'edit';
}): string {
  if (s.busy) return 'Fotoğraf yükleniyor…';
  if (!s.hasPhoto) return 'Önce kıyafetinin fotoğrafını ekle.';
  if (!s.category) return 'Bir kategori seç.';
  if (!s.subcategory) return 'Bir alt kategori seç.';
  if (!s.color) return 'Bir renk seç.';
  return '';
}

function FormGroup({
  title,
  required,
  hint,
  error,
  children,
}: {
  title: string;
  required?: boolean;
  hint?: string;
  error?: string;
  children: ReactNode;
}) {
  return (
    <View style={styles.group}>
      <View style={styles.groupHead}>
        <Typography variant="h3">{title}</Typography>
        {required ? <Typography variant="caption">Zorunlu</Typography> : null}
      </View>
      {hint ? <Typography variant="small">{hint}</Typography> : null}
      {children}
      {error ? (
        <Typography variant="small" color={colors.danger}>
          {error}
        </Typography>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { padding: spacing.md, paddingBottom: spacing.xxl, gap: spacing.xl, maxWidth: 720, width: '100%', alignSelf: 'center' },
  titleBlock: { gap: 4 },
  group: { gap: spacing.sm },
  groupHead: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between' },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  swatches: { flexDirection: 'row', flexWrap: 'wrap', rowGap: 2, columnGap: 2 },
  detectRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.xs, flexWrap: 'wrap' },
  autoBadge: { backgroundColor: colors.successBg, borderRadius: radius.pill, paddingHorizontal: 10, paddingVertical: 4 },
  manualBadge: { backgroundColor: colors.cream, borderRadius: radius.pill, paddingHorizontal: 10, paddingVertical: 4 },
  autoText: { fontSize: 12, lineHeight: 15 },
  measured: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  measuredSwatch: { width: 16, height: 16, borderRadius: 4, borderWidth: 1, borderColor: colors.border },
  hints: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: spacing.xs },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
  },
  sticky: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    paddingBottom: spacing.sm,
    gap: 6,
    backgroundColor: colors.background,
    borderTopWidth: 1,
    borderTopColor: colors.divider,
  },
  recent: { gap: spacing.sm },
  bleed: { marginHorizontal: -spacing.md, flexGrow: 0 },
  hList: { gap: spacing.sm, paddingHorizontal: spacing.md },
  savedBody: { flexDirection: 'row', gap: spacing.md, alignItems: 'center' },
  savedPhoto: { width: 96 },
  savedCheck: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 2 },
  savedActions: { gap: spacing.sm },
  loadingPad: { padding: spacing.md },
  photoSkeleton: { aspectRatio: 4 / 5 },
});
