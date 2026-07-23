import { useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../lib/auth';
import { useI18n } from '../i18n/I18nProvider';
import { colors } from '../theme/ThemeProvider';

export function LoginScreen() {
  const { loginWithPassword, requestOtp, verifyOtp } = useAuth();
  const { t, language, setLanguage } = useI18n();
  const [clockNumber, setClockNumber] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [useOtpMode, setUseOtpMode] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit() {
    setLoading(true);
    try {
      if (!useOtpMode) {
        await loginWithPassword(clockNumber, password);
      } else if (!otpSent) {
        await requestOtp(clockNumber);
        setOtpSent(true);
      } else {
        await verifyOtp(clockNumber, otp);
      }
    } catch (err) {
      Alert.alert('Login failed', 'Please check your credentials and try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>🍽 My Union Canteen</Text>

      <TextInput
        style={styles.input}
        placeholder={t('clockNumber')}
        autoCapitalize="characters"
        value={clockNumber}
        onChangeText={setClockNumber}
      />

      {!useOtpMode ? (
        <TextInput style={styles.input} placeholder={t('password')} secureTextEntry value={password} onChangeText={setPassword} />
      ) : otpSent ? (
        <TextInput style={styles.input} placeholder="OTP" keyboardType="number-pad" value={otp} onChangeText={setOtp} />
      ) : null}

      <TouchableOpacity onPress={() => setUseOtpMode((v) => !v)}>
        <Text style={styles.link}>{useOtpMode ? t('password') : t('useOtp')}</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.button} onPress={handleSubmit} disabled={loading}>
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>{t('login')}</Text>}
      </TouchableOpacity>

      <View style={styles.langRow}>
        <TouchableOpacity onPress={() => setLanguage('en')}>
          <Text style={language === 'en' ? styles.langActive : styles.lang}>English</Text>
        </TouchableOpacity>
        <Text style={styles.lang}> | </Text>
        <TouchableOpacity onPress={() => setLanguage('mr')}>
          <Text style={language === 'mr' ? styles.langActive : styles.lang}>मराठी</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 24, gap: 12 },
  title: { fontSize: 24, fontWeight: '700', textAlign: 'center', marginBottom: 24, color: colors.primary },
  input: { borderWidth: 1, borderColor: '#ccc', borderRadius: 10, padding: 14, fontSize: 16 },
  link: { color: colors.primary, textAlign: 'right', marginBottom: 8 },
  button: { backgroundColor: colors.primary, borderRadius: 10, padding: 16, alignItems: 'center', marginTop: 8 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  langRow: { flexDirection: 'row', justifyContent: 'center', marginTop: 24 },
  lang: { color: '#888' },
  langActive: { color: colors.primary, fontWeight: '700' },
});
