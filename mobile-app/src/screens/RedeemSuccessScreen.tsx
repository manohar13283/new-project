import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/RootNavigator';
import { useI18n } from '../i18n/I18nProvider';
import { colors } from '../theme/ThemeProvider';

type Props = NativeStackScreenProps<RootStackParamList, 'RedeemSuccess'>;

export function RedeemSuccessScreen({ route, navigation }: Props) {
  const { transactionId, couponType, remainingAfter } = route.params;
  const { t } = useI18n();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.center}>
        <Text style={styles.check}>✅</Text>
        <Text style={styles.title}>{t('success')}</Text>
        <Text style={styles.subtitle}>{t('couponRedeemed')}</Text>
        <Text style={styles.remaining}>
          Remaining {couponType.replace('_', ' + ')}: {remainingAfter}
        </Text>
      </View>

      <View style={styles.actions}>
        <TouchableOpacity style={styles.rateButton} onPress={() => navigation.replace('Feedback', { transactionId })}>
          <Text style={styles.rateButtonText}>{t('rateYourMeal')}</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => navigation.navigate('Home')}>
          <Text style={styles.skip}>{t('skip')}</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'space-between', padding: 24 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  check: { fontSize: 64 },
  title: { fontSize: 24, fontWeight: '700', marginTop: 12 },
  subtitle: { color: '#666', marginTop: 4 },
  remaining: { marginTop: 16, fontSize: 16, fontWeight: '600', color: colors.primary },
  actions: { gap: 12, alignItems: 'center', paddingBottom: 24 },
  rateButton: { backgroundColor: colors.secondary, borderRadius: 12, padding: 16, alignItems: 'center', width: '100%' },
  rateButtonText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  skip: { color: '#888' },
});
