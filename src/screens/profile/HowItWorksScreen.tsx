import { Plus } from 'lucide-react-native';
import { ScrollView, StyleSheet } from 'react-native';

import { HowItWorksSteps, PrimaryButton, Screen, ScreenHeader, Typography } from '../../components';
import type { RootScreenProps } from '../../navigation/types';
import { colors, spacing } from '../../theme';

export function HowItWorksScreen({ navigation }: RootScreenProps<'HowItWorks'>) {
  return (
    <Screen>
      <ScreenHeader title="Nasıl çalışır?" onBack={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={styles.content}>
        <Typography variant="display">Dolabındakini daha iyi kullan.</Typography>
        <Typography variant="body" color={colors.textSecondary}>
          Yeni kıyafet satın almadan önce, dolabındaki parçaları daha iyi kullan. RYVENCA yalnızca senin
          parçalarından kombin önerir ve her kombin için bir Uyum Skoru ile nedenini açıklar.
        </Typography>
        <HowItWorksSteps />
        <PrimaryButton label="Parça Ekle" icon={Plus} onPress={() => navigation.navigate('Main', { screen: 'Upload' })} />
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.md, gap: spacing.lg, paddingBottom: spacing.xxxl, maxWidth: 720, width: '100%', alignSelf: 'center' },
});
