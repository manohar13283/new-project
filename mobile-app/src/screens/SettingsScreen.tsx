import { StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppTheme } from '../theme/ThemeProvider';
import { useI18n } from '../i18n/I18nProvider';
import { useAuth } from '../lib/auth';
import { colors } from '../theme/ThemeProvider';

export function SettingsScreen() {
  const { mode, toggle } = useAppTheme();
  const { language, setLanguage, t } = useI18n();
  const { logout } = useAuth();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.row}>
        <Text style={styles.label}>{t('darkMode')}</Text>
        <Switch value={mode === 'dark'} onValueChange={toggle} />
      </View>

      <View style={styles.row}>
        <Text style={styles.label}>{t('language')}</Text>
        <View style={styles.langButtons}>
          <TouchableOpacity onPress={() => setLanguage('en')} style={[styles.langBtn, language === 'en' && styles.langBtnActive]}>
            <Text style={language === 'en' ? styles.langTextActive : styles.langText}>English</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setLanguage('mr')} style={[styles.langBtn, language === 'mr' && styles.langBtnActive]}>
            <Text style={language === 'mr' ? styles.langTextActive : styles.langText}>मराठी</Text>
          </TouchableOpacity>
        </View>
      </View>

      <TouchableOpacity style={styles.logoutButton} onPress={logout}>
        <Text style={styles.logoutText}>Logout</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#eee' },
  label: { fontSize: 16, fontWeight: '600' },
  langButtons: { flexDirection: 'row', gap: 8 },
  langBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, borderWidth: 1, borderColor: '#ccc' },
  langBtnActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  langText: { color: '#444' },
  langTextActive: { color: '#fff', fontWeight: '700' },
  logoutButton: { marginTop: 32, alignItems: 'center', padding: 16, borderRadius: 12, backgroundColor: '#FDECEA' },
  logoutText: { color: '#C0392B', fontWeight: '700' },
});
