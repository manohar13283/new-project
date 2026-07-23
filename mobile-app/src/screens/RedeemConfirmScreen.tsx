import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/RootNavigator';
import { api } from '../lib/api';
import { getDeviceId } from '../lib/device';
import { useI18n } from '../i18n/I18nProvider';
import { CouponType, TodayCouponsResponse } from '../types';
import { colors } from '../theme/ThemeProvider';

type Props = NativeStackScreenProps<RootStackParamList, 'RedeemConfirm'>;

const COUPON_LABEL_KEY: Record<CouponType, 'breakfastTea' | 'meal' | 'tea'> = {
  BREAKFAST_TEA: 'breakfastTea',
  MEAL: 'meal',
  TEA: 'tea',
};

export function RedeemConfirmScreen({ route, navigation }: Props) {
  const { qrCodeValue } = route.params;
  const { t } = useI18n();
  const [data, setData] = useState<TodayCouponsResponse | null>(null);
  const [selected, setSelected] = useState<CouponType | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    api.get<TodayCouponsResponse>('/me/coupons/today').then((res) => {
      setData(res.data);
      const firstOpen = res.data.coupons.find((c) => c.isOpenNow && !c.usedToday);
      if (firstOpen) setSelected(firstOpen.type);
    });
  }, []);

  async function confirm() {
    if (!selected) return;
    setSubmitting(true);
    try {
      const deviceId = await getDeviceId();
      const res = await api.post('/scan/redeem', { qrCodeValue, couponType: selected, deviceId });
      navigation.replace('RedeemSuccess', {
        transactionId: res.data.transactionId,
        couponType: selected,
        remainingAfter: res.data.remainingAfter,
      });
    } catch (err: any) {
      const message = err.response?.data?.message ?? 'Could not redeem coupon. Please try again.';
      Alert.alert('Redemption Failed', message, [{ text: 'OK', onPress: () => navigation.navigate('Home') }]);
    } finally {
      setSubmitting(false);
    }
  }

  if (!data) {
    return (
      <SafeAreaView style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.shiftLabel}>
        Shift: {data.shift} · {new Date().toLocaleTimeString()}
      </Text>

      {data.coupons.map((c) => {
        const disabled = !c.isOpenNow || c.usedToday || c.remaining <= 0;
        return (
          <TouchableOpacity
            key={c.type}
            style={[styles.option, selected === c.type && styles.optionSelected, disabled && styles.optionDisabled]}
            disabled={disabled}
            onPress={() => setSelected(c.type)}
          >
            <View style={[styles.radio, selected === c.type && styles.radioSelected]} />
            <View style={{ flex: 1 }}>
              <Text style={styles.optionLabel}>{t(COUPON_LABEL_KEY[c.type])}</Text>
              <Text style={styles.optionMeta}>
                {c.usedToday ? t('used') : c.window}
              </Text>
            </View>
            {c.isOpenNow && !c.usedToday && <Text style={styles.openTag}>{t('openNow')}</Text>}
          </TouchableOpacity>
        );
      })}

      <TouchableOpacity style={styles.confirmButton} disabled={!selected || submitting} onPress={confirm}>
        {submitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.confirmButtonText}>{t('confirm')}</Text>}
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  shiftLabel: { color: '#666', marginBottom: 16 },
  option: { flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 12, backgroundColor: '#F2F2F2', marginBottom: 12 },
  optionSelected: { borderWidth: 2, borderColor: colors.primary },
  optionDisabled: { opacity: 0.4 },
  radio: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: '#999', marginRight: 12 },
  radioSelected: { borderColor: colors.primary, backgroundColor: colors.primary },
  optionLabel: { fontSize: 16, fontWeight: '700' },
  optionMeta: { color: '#666', marginTop: 2 },
  openTag: { color: colors.primary, fontWeight: '700', fontSize: 12 },
  confirmButton: { backgroundColor: colors.primary, borderRadius: 12, padding: 16, alignItems: 'center', marginTop: 12 },
  confirmButtonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
