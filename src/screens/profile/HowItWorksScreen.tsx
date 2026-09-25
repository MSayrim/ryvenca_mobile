import { Plus } from 'lucide-react-native';
import { ScrollView, StyleSheet } from 'react-native';

import { HowItWorksSteps, PrimaryButton, Screen, ScreenHeader, Typography } from '../../components';
import { useTranslation } from '../../i18n';
import type { RootScreenProps } from '../../navigation/types';
import { colors, spacing } from '../../theme';

export function HowItWorksScreen({ navigation }: RootScreenProps<'HowItWorks'>) {
  const { t } = useTranslation();
  return (
    <Screen>
      <ScreenHeader title={t('howItWorks.title')} onBack={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={styles.content}>
        <Typography variant="display">{t('howItWorks.headline')}</Typography>
        <Typography variant="body" color={colors.textSecondary}>
          {t('howItWorks.intro')}
        </Typography>
        <HowItWorksSteps />
        <PrimaryButton label={t('common.addPiece')} icon={Plus} onPress={() => navigation.navigate('Main', { screen: 'Upload' })} />
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.md, gap: spacing.lg, paddingBottom: spacing.xxxl, maxWidth: 720, width: '100%', alignSelf: 'center' },
});
