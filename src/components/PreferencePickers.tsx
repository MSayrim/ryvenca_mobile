import { Camera, Check, Shirt, Sparkles } from 'lucide-react-native';
import { Pressable, StyleSheet, View } from 'react-native';

import type { LabeledCode, StyleMeta, StylePreference, WardrobeType } from '../api/types';
import { colors, fonts, radius, spacing } from '../theme';
import { HangerIcon } from './HangerIcon';
import { Typography } from './Typography';

/** Large selectable cards: Kadın / Erkek / Unisex (labels from meta). */
export function WardrobeTypePicker({
  options,
  value,
  onChange,
}: {
  options: LabeledCode<WardrobeType>[];
  value: WardrobeType | null;
  onChange: (value: WardrobeType) => void;
}) {
  return (
    <View style={styles.typeList} accessibilityRole="radiogroup">
      {options.map((opt) => {
        const selected = opt.code === value;
        return (
          <Pressable
            key={opt.code}
            onPress={() => onChange(opt.code)}
            accessibilityRole="radio"
            accessibilityState={{ selected }}
            accessibilityLabel={opt.label}
            style={({ pressed }) => [styles.typeCard, selected && styles.typeCardSelected, pressed && styles.pressed]}
          >
            <View style={[styles.typeIcon, selected && styles.typeIconSelected]}>
              <HangerIcon size={26} color={selected ? colors.surface : colors.brown} />
            </View>
            <Typography variant="h2" style={styles.flex} color={selected ? colors.surface : colors.ink}>
              {opt.label}
            </Typography>
            <View style={[styles.radio, selected && styles.radioSelected]}>
              {selected ? <Check size={14} color={colors.ink} strokeWidth={2.2} /> : null}
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}

/** Multi-select style chips with descriptions (from meta.styles). */
export function StylePicker({
  options,
  value,
  onToggle,
}: {
  options: StyleMeta[];
  value: StylePreference[];
  onToggle: (code: StylePreference) => void;
}) {
  return (
    <View style={styles.styleGrid}>
      {options.map((opt) => {
        const selected = value.includes(opt.code);
        return (
          <Pressable
            key={opt.code}
            onPress={() => onToggle(opt.code)}
            accessibilityRole="checkbox"
            accessibilityState={{ checked: selected }}
            accessibilityLabel={`${opt.label}. ${opt.description}`}
            style={({ pressed }) => [styles.styleCard, selected && styles.styleCardSelected, pressed && styles.pressed]}
          >
            <View style={styles.styleHead}>
              <Typography style={[styles.styleLabel, selected && { color: colors.surface }]} numberOfLines={1}>
                {opt.label}
              </Typography>
              {selected ? <Check size={16} color={colors.surface} strokeWidth={2} /> : null}
            </View>
            <Typography variant="small" color={selected ? colors.beige : colors.textSecondary} numberOfLines={2}>
              {opt.description}
            </Typography>
          </Pressable>
        );
      })}
    </View>
  );
}

const STEPS = [
  { icon: Camera, title: 'Fotoğrafını çek', text: 'Askıda, yatakta ya da koltukta — normal telefon fotoğrafı yeterli.' },
  { icon: Shirt, title: 'Dolabın düzenlensin', text: 'Rengi otomatik algılarız; kategori ve mevsimle dolabın kendiliğinden düzenlenir.' },
  { icon: Sparkles, title: 'Kombinini keşfet', text: 'Sadece kendi parçalarından, Uyum Skoru ve açıklamasıyla kombinler.' },
] as const;

/** "Nasıl çalışır?" — 3 short steps. */
export function HowItWorksSteps() {
  return (
    <View style={styles.steps}>
      {STEPS.map((step, i) => {
        const Icon = step.icon;
        return (
          <View key={step.title} style={styles.step}>
            <View style={styles.stepIcon}>
              <Icon size={22} color={colors.brown} strokeWidth={1.5} />
            </View>
            <View style={styles.flex}>
              <Typography variant="caption" color={colors.softBrown} style={styles.stepNo}>
                {`ADIM ${i + 1}`}
              </Typography>
              <Typography variant="h3">{step.title}</Typography>
              <Typography variant="small" style={styles.stepText}>
                {step.text}
              </Typography>
            </View>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  pressed: { opacity: 0.88 },
  typeList: { gap: spacing.sm },
  typeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.lg,
    minHeight: 92,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  typeCardSelected: { backgroundColor: colors.ink, borderColor: colors.ink },
  typeIcon: {
    width: 52,
    height: 52,
    borderRadius: 999,
    backgroundColor: colors.cream,
    alignItems: 'center',
    justifyContent: 'center',
  },
  typeIconSelected: { backgroundColor: colors.brown },
  radio: {
    width: 24,
    height: 24,
    borderRadius: 999,
    borderWidth: 1.5,
    borderColor: colors.sand,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioSelected: { backgroundColor: colors.surface, borderColor: colors.surface },
  styleGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  styleCard: {
    width: '48.5%',
    flexGrow: 1,
    minHeight: 76,
    borderRadius: radius.md,
    padding: spacing.sm,
    backgroundColor: colors.surfaceAlt,
    gap: 4,
  },
  styleCardSelected: { backgroundColor: colors.ink },
  styleHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 4 },
  styleLabel: { fontFamily: fonts.bodySemiBold, fontSize: 15, lineHeight: 20, color: colors.ink, flexShrink: 1 },
  steps: { gap: spacing.md },
  step: {
    flexDirection: 'row',
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  stepIcon: {
    width: 48,
    height: 48,
    borderRadius: 999,
    backgroundColor: colors.cream,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepNo: { letterSpacing: 1.4 },
  stepText: { marginTop: 2 },
});
