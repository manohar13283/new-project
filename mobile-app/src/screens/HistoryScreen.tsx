import { useEffect, useState } from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { api } from '../lib/api';
import { colors } from '../theme/ThemeProvider';

interface TransactionRow {
  id: string;
  couponType: string;
  businessDate: string;
  scannedAt: string;
  status: string;
}

const COUPON_ICON: Record<string, string> = { BREAKFAST_TEA: '🍳', MEAL: '🍛', TEA: '☕' };

export function HistoryScreen() {
  const [rows, setRows] = useState<TransactionRow[]>([]);

  useEffect(() => {
    api.get<TransactionRow[]>('/me/transactions').then((res) => setRows(res.data));
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={rows}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 16 }}
        renderItem={({ item }) => (
          <View style={styles.row}>
            <Text style={styles.icon}>{COUPON_ICON[item.couponType]}</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.type}>{item.couponType.replace('_', ' + ')}</Text>
              <Text style={styles.date}>{item.businessDate}</Text>
            </View>
            <Text style={styles.time}>{new Date(item.scannedAt).toLocaleTimeString()}</Text>
          </View>
        )}
        ListEmptyComponent={<Text style={styles.empty}>No redemptions yet.</Text>}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#eee' },
  icon: { fontSize: 24, marginRight: 12 },
  type: { fontWeight: '700' },
  date: { color: '#888', fontSize: 12 },
  time: { color: colors.primary, fontWeight: '600' },
  empty: { textAlign: 'center', color: '#888', marginTop: 40 },
});
