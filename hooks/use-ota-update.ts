import { useEffect, useRef, useState } from "react";
import { Alert, AppState, Platform } from "react-native";
import * as Updates from "expo-updates";
import * as Notifications from "expo-notifications";

// Fonctionnement simple : dès qu'une OTA existe sur le canal, on prévient
// et on propose de redémarrer. Pas de cooldown, pas de cas spéciaux.
// Rappel : OTA = JS uniquement. Nouveau module natif → nouvel APK, pas OTA.
// Permet aux notifs locales de s'afficher même au premier plan — uniquement natif
if (Platform.OS !== "web") {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });

  // Canal Android obligatoire depuis Android 8
  Notifications.setNotificationChannelAsync("updates", {
    name: "Mises à jour",
    importance: Notifications.AndroidImportance.HIGH,
    vibrationPattern: [0, 250, 250, 250],
    lightColor: "#FF9500",
    enableVibrate: true,
    enableLights: true,
    bypassDnd: false,
    lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
  }).catch(() => {});
}

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
        content: {
          title,
          body,
          sound: true,
          badge: 1,
          priority: Notifications.AndroidNotificationPriority.HIGH,
        },
        trigger: Platform.OS === "android" ? { channelId: "updates" } : null,
      });
    } catch {}
  };

  const checkAndNotify = async () => {
    if (!Updates.isEnabled) return false;
    if (checking) return false;
    try {
      setChecking(true);
      const check = await Updates.checkForUpdateAsync();
      if (!check.isAvailable) return false;
      setUpdateAvailable(true);
      await Updates.fetchUpdateAsync();
      await notifyLocal("Akouè — mise à jour prête", "Une nouvelle version est téléchargée. Redémarre pour l'appliquer.");
      Alert.alert("Mise à jour prête", "Une nouvelle version est téléchargée. Redémarrer maintenant ?", [
        { text: "Plus tard", style: "cancel" },
        { text: "Redémarrer", onPress: async () => { await Updates.reloadAsync(); } },
      ]);
      return true;
    } catch {
      return false;
    } finally {
      setChecking(false);
    }
  };

  useEffect(() => {
    if (checkedOnce.current) return;
    checkedOnce.current = true;
    const t = setTimeout(() => { checkAndNotify(); }, 3000);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    const sub = AppState.addEventListener("change", (state) => {
      if (state === "active") checkAndNotify();
    });
    return () => sub.remove();
  }, []);

  useEffect(() => {
    if (Platform.OS === "web") return;
    const sub = Notifications.addNotificationResponseReceivedListener(() => {
      Alert.alert("Mise à jour prête", "Redémarrer pour l'appliquer ?", [
        { text: "Plus tard", style: "cancel" },
        { text: "Redémarrer", onPress: async () => { await Updates.reloadAsync(); } },
      ]);
    });
    return () => sub.remove();
  }, []);

  return { updateAvailable, checking, checkAndNotify };
}
