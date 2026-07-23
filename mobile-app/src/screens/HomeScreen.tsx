import { useCallback, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/RootNavigator';
import { useAuth } from '../lib/auth';
import { useI18n } from '../i18n/I18nProvider';
import { api } from '../lib/api';
import { TodayCouponsResponse } from '../types';
import { colors } from '../theme/ThemeProvider';

const COUPON_ICON: Record<string, string> = { BREAKFAST_TEA: '🍳', MEAL: '🍛', TEA: '☕' };
const COUPON_LABEL_KEY: Record<string, 'breakfastTea' | 'meal' | 'tea'> = {
  BREAKFAST_TEA: 'breakfastTea',
  MEAL: 'meal',
  TEA: 'tea',
};

type Props = NativeStackScreenProps<RootStackParamList, 'Home'>;

export function HomeScreen({ navigation }: Props) {
  const { worker, logout } = useAuth();
  const { t } = useI18n();
  const [data, setData] = useState<TodayCouponsResponse | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    const res = await api.get<TodayCouponsResponse>('/me/coupons/today');
    setData(res.data);
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  async function onRefresh() {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Hi, {worker?.fullName}</Text>
            <Text style={styles.subGreeting}>{worker?.clockNumber}</Text>
          </View>
          <TouchableOpacity onPress={logout}>
            <Text style={styles.logout}>Logout</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.sectionTitle}>{t('todaysCoupons')}</Text>
        <View style={styles.couponGrid}>
          {data?.coupons.map((c) => (
            <View key={c.type} style={[styles.couponCard, c.isOpenNow && styles.couponCardOpen]}>
              <Text style={styles.couponIcon}>{COUPON_ICON[c.type]}</Text>
              <Text style={styles.couponLabel}>{t(COUPON_LABEL_KEY[c.type])}</Text>
              <Text style={styles.couponWindow}>{c.window}</Text>
              {c.usedToday ? (
                <Text style={styles.usedBadge}>{t('used')} ✓</Text>
              ) : c.isOpenNow ? (
                <Text style={styles.openBadge}>{t('openNow')}</Text>
              ) : null}
            </View>
          ))}
        </View>

        <Text style={styles.sectionTitle}>{t('monthlyBalance')}</Text>
        <View style={styles.balanceRow}>
          {data?.coupons.map((c) => (
            <Text key={c.type} style={styles.balanceItem}>
              {COUPON_ICON[c.type]} {c.remaining}
            </Text>
          ))}
        </View>
      </ScrollView>

      <TouchableOpacity style={styles.scanButton} onPress={() => navigation.navigate('Scan')}>
        <Text style={styles.scanButtonText}>📷 {t('scanCanteenQr')}</Text>
      </TouchableOpacity>

      <View style={styles.tabBar}>
        <TouchableOpacity onPress={() => navigation.navigate('Home')}>
          <Text style={styles.tabActive}>{t('home')}</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => navigation.navigate('History')}>
          <Text style={styles.tab}>{t('history')}</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => navigation.navigate('Settings')}>
          <Text style={styles.tab}>{t('settings')}</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16 },
  greeting: { fontSize: 20, fontWeight: '700' },
  subGreeting: { color: '#888' },
  logout: { color: colors.primary },
  sectionTitle: { fontSize: 16, fontWeight: '700', marginHorizontal: 16, marginTop: 12, marginBottom: 8 },
  couponGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 12, gap: 10 },
  couponCard: { width: '45%', backgroundColor: '#F2F2F2', borderRadius: 14, padding: 14, margin: 4, alignItems: 'center' },
  couponCardOpen: { backgroundColor: colors.successBg, borderWidth: 1, borderColor: colors.primary },
  couponIcon: { fontSize: 28 },
  couponLabel: { fontWeight: '700', marginTop: 4 },
  couponWindow: { color: '#666', fontSize: 12, marginTop: 2 },
  usedBadge: { marginTop: 6, color: '#666', fontWeight: '700' },
  openBadge: { marginTop: 6, color: colors.primary, fontWeight: '700' },
  balanceRow: { flexDirection: 'row', justifyContent: 'space-around', paddingVertical: 8, paddingHorizontal: 16 },
  balanceItem: { fontSize: 16, fontWeight: '600' },
  scanButton: { backgroundColor: colors.primary, margin: 16, borderRadius: 14, padding: 18, alignItems: 'center' },
  scanButtonText: { color: '#fff', fontSize: 17, fontWeight: '700' },
  tabBar: { flexDirection: 'row', justifyContent: 'space-around', borderTopWidth: 1, borderTopColor: '#eee', paddingVertical: 10 },
  tab: { color: '#888' },
  tabActive: { color: colors.primary, fontWeight: '700' },
});
