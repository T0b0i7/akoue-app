import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";
import { StyleSheet, View } from "react-native";
import { colors } from "@/constants/theme";
import { AuthProvider } from "@/context/auth-context";
import { LocaleProvider } from "@/context/locale-context";
import { ToastProvider } from "@/context/toast-context";
import { ThemeProvider } from "@/context/theme-context";
import { AppToast } from "@/components/app-toast";
import { useOTAUpdate } from "@/hooks/use-ota-update";

import "./global.css";

SplashScreen.preventAutoHideAsync().catch(() => {});

function OTAWatcher() {
  useOTAUpdate();
  return null;
}

export default function RootLayout() {
  useEffect(() => {
    // Cache le splash natif immédiatement — on utilise un seul splash custom dans app/index.tsx
    SplashScreen.hideAsync().catch(() => {});
  }, []);

	return (
		<ToastProvider>
			<ThemeProvider>
				<AuthProvider>
					<LocaleProvider>
						<OTAWatcher />
						<AppToast />
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
			</ThemeProvider>
		</ToastProvider>
	);
}

const styles = StyleSheet.create({
	appBackground: {
		flex: 1,
		backgroundColor: colors.neutral900,
	},
});
