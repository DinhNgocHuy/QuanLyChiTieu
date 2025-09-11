import { DarkTheme, DefaultTheme, ThemeProvider as NavigationThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Provider } from 'react-redux';
import { store } from '../store/store';

import { useColorScheme } from '@/hooks/useColorScheme';
import { AuthProvider } from '../contexts/AuthContext';
import { DataProvider } from '../contexts/DataContext';
import { InvestmentProvider } from '../contexts/InvestmentContext';
import { ThemeProvider } from '../contexts/ThemeContext';

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [loaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  if (!loaded) {
    return null;
  }

  return (
    // All providers go here — they wrap the entire app
    <Provider store={store}>
    <ThemeProvider>
      <AuthProvider>
        <DataProvider>
          <InvestmentProvider>
            <NavigationThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
              <Stack screenOptions={{ headerShown: false }}>
                {/* Auth Screens */}
                <Stack.Screen name="login" />
                <Stack.Screen name="signup" />

                {/* Tab Navigator */}
                <Stack.Screen name="(tabs)" />

                {/* Modal Screens */}
                <Stack.Screen
                  name="Calculator"
                  options={{
                    presentation: 'modal',
                    animation: 'slide_from_bottom',
                    headerShown: false,
                  }}
                />

                {/* Fallback */}
                <Stack.Screen name="+not-found" />
              </Stack>
              <StatusBar style="auto" />
            </NavigationThemeProvider>
          </InvestmentProvider>
        </DataProvider>
      </AuthProvider>
    </ThemeProvider>
    </Provider>
  );
}