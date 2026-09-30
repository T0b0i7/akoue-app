import { Stack } from "expo-router";
import { usePathname, useRouter } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect, useState } from "react";
import { Platform, StyleSheet, View } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
// @ts-ignore expo-asset déjà présent via expo mais types pnpm non résolus
import { Asset } from "expo-asset";
import { colors } from "@/constants/theme";
import { AuthProvider } from "@/context/auth-context";
import { LocaleProvider } from "@/context/locale-context";
import { ToastProvider } from "@/context/toast-context";
import { ThemeProvider } from "@/context/theme-context";
import { AppToast } from "@/components/app-toast";
import AppLockGate from "@/components/app-lock-gate";
import { useAppLock } from "@/hooks/use-app-lock";
import { useOTAUpdate } from "@/hooks/use-ota-update";
import { useBroadcast } from "@/hooks/use-broadcast";
import UpdateModal from "@/components/update-modal";

if (Platform.OS !== "web") {
  SplashScreen.preventAutoHideAsync().catch(() => {});
}

function OTAWatcher() {
  useOTAUpdate();
  return null;
}
function BroadcastWatcher() {
  const bc = useBroadcast();
  return (
    <UpdateModal
      update={bc.update}
      downloading={bc.downloading}
      busy={bc.busy}
      progress={bc.progress}
      onUpdate={bc.openUpdate}
      onLater={bc.laterUpdate}
      onDone={bc.doneUpdate}
    />
  );
}

// Choix du verrou obligatoire sur une PAGE (pas de bottom-sheet) :
// redirige vers la page tant que l'utilisateur n'a pas choisi.
function LockSetupRedirect({ showEnroll, locked, checking }: { showEnroll: boolean; locked: boolean; checking: boolean }) {
  const router = useRouter();
  const pathname = usePathname();
  useEffect(() => {
    if (checking || locked) return;
    if (showEnroll && pathname !== "/(modals)/app-lock-setup") {
      router.replace("/(modals)/app-lock-setup" as any);
    }
  }, [showEnroll, locked, checking, pathname]);
  return null;
}

export default function RootLayout() {
  const [ready, setReady] = useState(false);
  const lock = useAppLock();
  const pathname = usePathname();
  // Retour de la page de configuration → resync sans toucher au verrou
  useEffect(() => {
    lock.syncEnroll();
  }, [pathname]);
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        if (Platform.OS !== "web") {
          await Asset.fromModule(require("../public/images/splash-icon.png")).downloadAsync();
        }
      } catch {}
      if (!cancelled) setReady(true);
      if (Platform.OS !== "web") {
        SplashScreen.hideAsync().catch(() => {});
      }
      try {
        if (typeof document !== "undefined" && (window as any).hideSplash) (window as any).hideSplash();
        else if (typeof document !== "undefined") {
          const s = document.getElementById("splash");
          if (s) { s.style.transition = "opacity 0.4s ease"; s.style.opacity = "0"; setTimeout(() => { s.style.display = "none"; }, 450); }
        }
      } catch {}
    })();
    return () => { cancelled = true; };
  }, []);

	return (
		<SafeAreaProvider>
		<ToastProvider>
			<ThemeProvider>
				<AuthProvider>
					<LocaleProvider>
						<OTAWatcher />
						<BroadcastWatcher />
						<LockSetupRedirect showEnroll={lock.showEnroll} locked={lock.locked} checking={lock.checking} />
						<AppToast />
						<AppLockGate
							locked={lock.locked}
							method={lock.method}
							onUnlockBiometric={lock.unlockBiometric}
							onUnlockSecret={lock.unlockSecret}
						/>
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
					<Stack.Screen
						name="(modals)/notifications-modal"
						options={{
							presentation: "modal",
						}}
					/>
					<Stack.Screen
						name="(modals)/loan-calculator-modal"
						options={{
							presentation: "modal",
						}}
					/>
					<Stack.Screen
						name="(modals)/split-bill-modal"
						options={{
							presentation: "modal",
						}}
					/>
					<Stack.Screen
						name="(modals)/export-data-modal"
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
		</SafeAreaProvider>
	);
}

const styles = StyleSheet.create({
	appBackground: {
		flex: 1,
		backgroundColor: colors.neutral900,
		minHeight: "100%" as any,
	},
});
