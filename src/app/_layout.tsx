import { Inter_400Regular } from '@expo-google-fonts/inter/400Regular';
import { Inter_500Medium } from '@expo-google-fonts/inter/500Medium';
import { Inter_600SemiBold } from '@expo-google-fonts/inter/600SemiBold';
import { Inter_700Bold } from '@expo-google-fonts/inter/700Bold';
import { useFonts } from 'expo-font';
import { type ErrorBoundaryProps, Tabs } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { CalendarDays, MapPin, Settings2, Sun } from 'lucide-react-native';
import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { ErrorState, LoadingState, Screen } from '../components/ui';
import { WeatherProvider } from '../context/weather-context';
import { colors, fonts } from '../theme';

void SplashScreen.preventAutoHideAsync().catch(() => undefined);

function Navigation() {
  const insets = useSafeAreaInsets();
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        animation: 'none',
        tabBarActiveTintColor: colors.amber,
        tabBarInactiveTintColor: colors.subtle,
        sceneStyle: styles.scene,
        tabBarStyle: [
          styles.tabBar,
          { height: 80 + insets.bottom, paddingBottom: Math.max(insets.bottom, 12) },
        ],
        tabBarLabelStyle: styles.tabLabel,
        tabBarItemStyle: styles.tabItem,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Hoje',
          tabBarAccessibilityLabel: 'Hoje',
          tabBarIcon: ({ color }) => <Sun size={21} color={color} strokeWidth={1.7} />,
        }}
      />
      <Tabs.Screen
        name="forecast"
        options={{
          title: 'Previsão',
          tabBarAccessibilityLabel: 'Previsão',
          tabBarIcon: ({ color }) => <CalendarDays size={21} color={color} strokeWidth={1.7} />,
        }}
      />
      <Tabs.Screen
        name="cities"
        options={{
          title: 'Cidades',
          tabBarAccessibilityLabel: 'Cidades',
          tabBarIcon: ({ color }) => <MapPin size={21} color={color} strokeWidth={1.7} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Ajustes',
          tabBarAccessibilityLabel: 'Ajustes',
          tabBarIcon: ({ color }) => <Settings2 size={21} color={color} strokeWidth={1.7} />,
        }}
      />
    </Tabs>
  );
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });
  useEffect(() => {
    if (fontsLoaded || fontError) void SplashScreen.hideAsync().catch(() => undefined);
  }, [fontsLoaded, fontError]);
  return (
    <SafeAreaProvider>
      <StatusBar style="light" />
      {fontsLoaded || fontError ? (
        <WeatherProvider>
          <Navigation />
        </WeatherProvider>
      ) : (
        <View style={styles.loading}>
          <LoadingState />
        </View>
      )}
    </SafeAreaProvider>
  );
}

export function ErrorBoundary({ error, retry }: ErrorBoundaryProps) {
  return (
    <SafeAreaProvider>
      <Screen>
        <ErrorState
          message={error.message || 'Ocorreu um erro inesperado.'}
          onRetry={() => void retry()}
        />
      </Screen>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  scene: { backgroundColor: colors.background },
  loading: { flex: 1, backgroundColor: colors.background, justifyContent: 'center' },
  tabBar: {
    backgroundColor: '#141A1E',
    borderTopColor: colors.border,
    borderTopWidth: 1,
    paddingTop: 9,
    elevation: 0,
  },
  tabLabel: { fontSize: 10, fontFamily: fonts.medium, lineHeight: 16, marginBottom: 0 },
  tabItem: { paddingVertical: 0 },
});
