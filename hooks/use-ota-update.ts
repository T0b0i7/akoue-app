import { useEffect, useRef, useState } from "react";
import { Alert, AppState, Platform } from "react-native";
import * as Updates from "expo-updates";
import * as Notifications from "expo-notifications";

// Permet aux notifs locales de s'afficher même au premier plan
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export function useOTAUpdate() {
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [checking, setChecking] = useState(false);
  const checkedOnce = useRef(false);

  const notifyLocal = async (title: string, body: string) => {
    try {
      if (Platform.OS === "web") return;
      const perms = await Notifications.getPermissionsAsync();
      if (perms.status !== "granted") {
        const req = await Notifications.requestPermissionsAsync();
        if (req.status !== "granted") return;
      }
      await Notifications.scheduleNotificationAsync({
        content: { title, body, sound: false },
        trigger: null,
      });
    } catch {}
  };

  const checkAndNotify = async (silent = true) => {
    if (!Updates.isEnabled) return false;
    if (checking) return false;
    try {
      setChecking(true);
      const check = await Updates.checkForUpdateAsync();
      if (check.isAvailable) {
        setUpdateAvailable(true);
        await Updates.fetchUpdateAsync();
        // Notif système + alerte in-app
        await notifyLocal("Akouè — mise à jour disponible", "Ouvre l'app pour redémarrer et installer la dernière version.");
        if (!silent) {
          Alert.alert("Mise à jour prête", "Une mise à jour a été téléchargée. Redémarrer maintenant ?", [
            { text: "Plus tard", style: "cancel" },
            { text: "Redémarrer", onPress: async () => { await Updates.reloadAsync(); } },
          ]);
        } else {
          // En silent on affiche quand même une alerte non-bloquante au premier check
          Alert.alert("Mise à jour disponible", "Une nouvelle version est prête. Va dans Plus → Vérifier les mises à jour pour redémarrer.", [
            { text: "Plus tard", style: "cancel" },
            { text: "Redémarrer", onPress: async () => { await Updates.reloadAsync(); } },
          ]);
        }
        return true;
      }
      return false;
    } catch {
      return false;
    } finally {
      setChecking(false);
    }
  };

  useEffect(() => {
    if (checkedOnce.current) return;
    checkedOnce.current = true;
    // Premier check 3s après ouverture
    const t = setTimeout(() => { checkAndNotify(true); }, 3000);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    const sub = AppState.addEventListener("change", (state) => {
      if (state === "active") checkAndNotify(true);
    });
    return () => sub.remove();
  }, []);

  return { updateAvailable, checking, checkAndNotify };
}
