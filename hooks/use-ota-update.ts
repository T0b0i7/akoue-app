import { useEffect, useRef, useState } from "react";
import { Alert, AppState, Platform } from "react-native";
import * as Updates from "expo-updates";
import * as Notifications from "expo-notifications";
import AsyncStorage from "@react-native-async-storage/async-storage";

// Permet aux notifs locales de s'afficher même au premier plan — uniquement natif
if (Platform.OS !== "web") {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: false,
      shouldSetBadge: false,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });
}

const UPDATE_SEEN_KEY = "update_seen_at";
const UPDATE_COOLDOWN_DAYS = 30;

export function useOTAUpdate() {
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [checking, setChecking] = useState(false);
  const checkedOnce = useRef(false);

  // Vérifier si c'est un nouvel utilisateur (pas de session utilisateur stockée)
  const isNewUser = async (): Promise<boolean> => {
    try {
      const user = await AsyncStorage.getItem("user");
      return !user;
    } catch {
      return true;
    }
  };

  // Récupérer la date à laquelle la mise à jour a été vue pour la dernière fois
  const getLastSeenUpdate = async (): Promise<string | null> => {
    try {
      return await AsyncStorage.getItem(UPDATE_SEEN_KEY);
    } catch {
      return null;
    }
  };

  // Marquer la mise à jour comme vue à la date actuelle
  const markUpdateAsSeen = async () => {
    try {
      await AsyncStorage.setItem(UPDATE_SEEN_KEY, new Date().toISOString());
    } catch {}
  };

  // Détecter si c'est une mise à jour majeure (ex: v2.0 vs v1.9)
  const isMajorUpdate = async (newVersion: string): Promise<boolean> => {
    try {
      const currentVersion = (await AsyncStorage.getItem("current_app_version")) || "1.0.0";
      const currentNum = parseInt(currentVersion.split(".")[0] || "1", 10);
      const newNum = parseInt(newVersion.split(".")[0] || "0", 10);
      return newNum > currentNum;
    } catch {
      return false;
    }
  };

  // Vérifier si on doit montrer la mise à jour (nouvel utilisateur ou cooldown écoulé)
  const shouldShowUpdate = async (): Promise<boolean> => {
    const newUser = await isNewUser();
    if (newUser) return true;

    const lastSeen = await getLastSeenUpdate();
    if (!lastSeen) return true;

    const lastDate = new Date(lastSeen);
    const now = new Date();
    const diffDays = (now.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24);

    return diffDays >= UPDATE_COOLDOWN_DAYS;
  };

  const notifyLocal = async (title: string, body: string) => {
    try {
      if (Platform.OS === "web") return;
      const perms = await Notifications.getPermissionsAsync();
      if (perms.status !== "granted") {
        const req = await Notifications.requestPermissionsAsync();
        if (req.status !== "granted") return;
      }
      await Notifications.scheduleNotificationAsync({
        content: { title, body, sound: false, badge: updateAvailable ? 1 : 0 },
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

        // Vérifier le cooldown pour les utilisateurs existants
        const newUser = await isNewUser();
        if (!newUser) {
          const allowed = await shouldShowUpdate();
          if (!allowed) return false;
        }

        // Déterminer le type d'utilisateur et le message
        const updateVersion = Updates.runtimeVersion || "latest";
        const isMajor = await isMajorUpdate(updateVersion);

        let updateMessage: string;
        if (newUser && isMajor) {
          updateMessage = `⚡ Première mise à jour majeure ! C'est votre première avec Akouè (v${updateVersion}).`;
        } else if (newUser && !isMajor) {
          updateMessage = `Nouvelle version disponible ! C'est votre première mise à jour avec Akouè (v${updateVersion}).`;
        } else if (!newUser && isMajor) {
          updateMessage = `Mise à jour majeure ! De nouvelles fonctionnalités sont présentes dans cette version (v${updateVersion}).`;
        } else {
          updateMessage = `Mise à jour disponible ! De nouvelles fonctionnalités sont présentes dans cette version (v${updateVersion}).`;
        }

        // Notif système + alerte in-app
        await notifyLocal("Akouè — mise à jour disponible", updateMessage);

        if (!silent) {
          const alertMsg = newUser
            ? "Une mise à jour a été téléchargée. Redémarrer maintenant pour bénéficier des nouvelles fonctionnalités ?"
            : "Une mise à jour a été téléchargée. Redémarrer maintenant ?";
          Alert.alert("Mise à jour prête", alertMsg, [
            { text: "Plus tard", style: "cancel" },
            { text: "Redémarrer", onPress: async () => { await Updates.reloadAsync(); } },
          ]);
        } else {
          const silentMessage = newUser
            ? "Une nouvelle version est prête. Va dans Plus → Vérifier les mises à jour pour redémarrer."
            : "Une nouvelle version est prête. Va dans Plus → Vérifier les mises à jour pour redémarrer.";
          Alert.alert("Mise à jour disponible", silentMessage, [
            { text: "Plus tard", style: "cancel" },
            { text: "Redémarrer", onPress: async () => { await Updates.reloadAsync(); } },
          ]);
        }

        // Marquer comme vu pour les utilisateurs existants
        if (!newUser) {
          await markUpdateAsSeen();
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

  // clic sur notif système → propose redémarrage
  useEffect(() => {
    if (Platform.OS === "web") return;
    const sub = Notifications.addNotificationResponseReceivedListener(() => {
      Alert.alert("Mise à jour disponible", "Redémarrer pour installer ?", [
        { text: "Plus tard", style: "cancel" },
        { text: "Redémarrer", onPress: async () => { await Updates.reloadAsync(); } },
      ]);
    });
    return () => sub.remove();
  }, []);

  return { updateAvailable, checking, checkAndNotify, shouldShowUpdate, markUpdateAsSeen };
}
