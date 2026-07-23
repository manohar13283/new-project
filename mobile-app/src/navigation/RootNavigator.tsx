import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuth } from '../lib/auth';
import { LoginScreen } from '../screens/LoginScreen';
import { HomeScreen } from '../screens/HomeScreen';
import { ScanScreen } from '../screens/ScanScreen';
import { RedeemConfirmScreen } from '../screens/RedeemConfirmScreen';
import { RedeemSuccessScreen } from '../screens/RedeemSuccessScreen';
import { FeedbackScreen } from '../screens/FeedbackScreen';
import { HistoryScreen } from '../screens/HistoryScreen';
import { SettingsScreen } from '../screens/SettingsScreen';
import { CouponType } from '../types';

export type RootStackParamList = {
  Login: undefined;
  Home: undefined;
  Scan: undefined;
  RedeemConfirm: { qrCodeValue: string };
  RedeemSuccess: { transactionId: string; couponType: CouponType; remainingAfter: number };
  Feedback: { transactionId: string };
  History: undefined;
  Settings: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export function RootNavigator() {
  const { worker, loading } = useAuth();

  if (loading) return null;

  return (
    <Stack.Navigator screenOptions={{ headerShown: true }}>
      {!worker ? (
        <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
      ) : (
        <>
          <Stack.Screen name="Home" component={HomeScreen} options={{ headerShown: false }} />
          <Stack.Screen name="Scan" component={ScanScreen} options={{ title: 'Scan Canteen QR' }} />
          <Stack.Screen name="RedeemConfirm" component={RedeemConfirmScreen} options={{ title: 'Select Coupon' }} />
          <Stack.Screen name="RedeemSuccess" component={RedeemSuccessScreen} options={{ headerShown: false }} />
          <Stack.Screen name="Feedback" component={FeedbackScreen} options={{ title: 'Feedback' }} />
          <Stack.Screen name="History" component={HistoryScreen} options={{ title: 'Coupon History' }} />
          <Stack.Screen name="Settings" component={SettingsScreen} options={{ title: 'Settings' }} />
        </>
      )}
    </Stack.Navigator>
  );
}
