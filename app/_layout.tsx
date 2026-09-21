import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet, View, Image, Text } from "react-native";
import { colors } from "@/constants/theme";
import { AuthProvider } from "@/context/auth-context";
import { LocaleProvider } from "@/context/locale-context";
import { useOTAUpdate } from "@/hooks/use-ota-update";

import "./global.css";

SplashScreen.preventAutoHideAsync().catch(() => {});

function OTAWatcher() {
  useOTAUpdate();
  return null;
}

function SplashLoader() {
  return (
    <View style={splashStyles.container}>
      <View style={splashStyles.logoWrap}>
        <Image source={require("@/public/images/splash-icon.png")} style={splashStyles.logo} resizeMode="contain" />
      </View>
      <Text style={splashStyles.title}>Akouè</Text>
      <Text style={splashStyles.subtitle}>Maîtrise ton argent</Text>
      <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 32 }} />
      <Text style={splashStyles.loadingText}>Chargement...</Text>
    </View>
  );
}

export default function RootLayout() {
  const [appReady, setAppReady] = useState(false);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        // Temps minimum pour voir le splash + laisse le temps à Supabase de restore session
        await new Promise((r) => setTimeout(r, 1800));
      } finally {
        if (mounted) {
          setAppReady(true);
          await SplashScreen.hideAsync().catch(() => {});
        }
      }
    })();
    return () => { mounted = false; };
  }, []);

  if (!appReady) return <SplashLoader />;

	return (
		<AuthProvider>
			<LocaleProvider>
				<OTAWatcher />
				<View style={styles.appBackground}>
				<Stack
					screenOptions={{
						headerShown: false,
						// animation: "slide_from_bottom",
						// animationDuration: 100,
					}}
				>
					<Stack.Screen
						name="(modals)/update-profile-modal"
						options={{
							presentation: "modal",
						}}
					/>
					<Stack.Screen
						name="(modals)/change-password-modal"
						options={{
							presentation: "modal",
						}}
					/>
					<Stack.Screen
						name="(modals)/setting-modal"
						options={{
							presentation: "modal",
						}}
					/>

					<Stack.Screen
						name="(modals)/search-modal"
						options={{
							presentation: "modal",
						}}
					/>

					<Stack.Screen
						name="(modals)/transaction-modal"
						options={{
							presentation: "modal",
						}}
					/>

					<Stack.Screen
						name="(modals)/wallet-modal"
						options={{
							presentation: "modal",
						}}
					/>

					<Stack.Screen
						name="(modals)/profile-modal"
						options={{
							presentation: "modal",
						}}
					/>
					<Stack.Screen
						name="(modals)/exchange-rate-modal"
						options={{
							presentation: "modal",
						}}
					/>
				</Stack>
				</View>
			</LocaleProvider>
		</AuthProvider>
	);
}

const styles = StyleSheet.create({
	appBackground: {
		flex: 1,
		backgroundColor: colors.neutral900,
	},
});

const splashStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#171717",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  logoWrap: {
    width: 140,
    height: 140,
    borderRadius: 32,
    backgroundColor: "#7A4DFF",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#7A4DFF",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.4,
    shadowRadius: 24,
    elevation: 12,
  },
  logo: { width: 96, height: 96, borderRadius: 16 },
  title: { marginTop: 24, fontSize: 32, fontWeight: "800", color: "#fff", letterSpacing: 1 },
  subtitle: { marginTop: 6, fontSize: 14, color: "#a3a3a3", letterSpacing: 2, textTransform: "uppercase" },
  loadingText: { marginTop: 12, fontSize: 13, color: "#737373" },
});
