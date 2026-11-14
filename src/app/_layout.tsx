import { AtkinsonHyperlegible_700Bold } from '@expo-google-fonts/atkinson-hyperlegible';
import { Inter_500Medium, Inter_600SemiBold, Inter_700Bold } from '@expo-google-fonts/inter';
import { useFonts } from 'expo-font';
import { DarkTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { AnimatedSplash } from '@/components/splash';
import { StoreProvider, useStore } from '@/lib/store';
import { C } from '@/lib/theme';

SplashScreen.preventAutoHideAsync().catch(() => {});

const theme = {
  ...DarkTheme,
  colors: { ...DarkTheme.colors, background: C.ink, card: C.ink, primary: C.accent, text: C.paper, border: C.graphite },
};

function Root() {
  const { ready, settings, updateSettings } = useStore();
  const [splash, setSplash] = useState(true);
  const [fontsLoaded, fontError] = useFonts({
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    AtkinsonHyperlegible_700Bold,
  });
  const done = ready && (fontsLoaded || !!fontError);

  useEffect(() => {
    if (done) SplashScreen.hideAsync().catch(() => {});
  }, [done]);

  if (!done) return null;

  return (
    <>
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: C.ink },
      }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="script/[id]" />
      <Stack.Screen name="record/[id]" options={{ animation: 'fade', gestureEnabled: false }} />
      <Stack.Screen
        name="style"
        options={{ presentation: 'formSheet', sheetAllowedDetents: [0.75, 1], sheetGrabberVisible: true, contentStyle: { backgroundColor: C.graphite } }}
      />
      <Stack.Screen name="review" options={{ gestureEnabled: false }} />
    </Stack>
    {splash ? (
      <AnimatedSplash
        firstRun={!settings.onboarded}
        onDone={() => {
          setSplash(false);
          if (!settings.onboarded) updateSettings({ onboarded: true });
        }}
      />
    ) : null}
    </>
  );
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: C.ink }}>
      <ThemeProvider value={theme}>
        <StoreProvider>
          <StatusBar style="light" />
          <Root />
        </StoreProvider>
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}
