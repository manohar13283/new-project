import 'react-native-gesture-handler';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { AuthProvider } from './src/lib/auth';
import { ThemeProvider, useAppTheme } from './src/theme/ThemeProvider';
import { I18nProvider } from './src/i18n/I18nProvider';
import { RootNavigator } from './src/navigation/RootNavigator';

function AppShell() {
  const { navigationTheme, mode } = useAppTheme();
  return (
    <NavigationContainer theme={navigationTheme}>
      <StatusBar style={mode === 'dark' ? 'light' : 'dark'} />
      <RootNavigator />
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <I18nProvider>
        <AuthProvider>
          <AppShell />
        </AuthProvider>
      </I18nProvider>
    </ThemeProvider>
  );
}
