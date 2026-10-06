import { useEffect, useRef, useState } from "react";
import { AppState } from "react-native";
import * as Updates from "expo-updates";

// OTA silencieuse : on télécharge en fond, elle s'applique toute seule
// au prochain démarrage. Pas de notif, pas de popup.
// Rappel : OTA = JS uniquement. Nouveau module natif → nouvel APK, pas OTA.
export function useOTAUpdate() {
  const [checking, setChecking] = useState(false);
  const checkedOnce = useRef(false);

  const checkAndApply = async () => {
    if (!Updates.isEnabled) return false;
    if (checking) return false;
    try {
      setChecking(true);
      const check = await Updates.checkForUpdateAsync();
      if (!check.isAvailable) return false;
      await Updates.fetchUpdateAsync();
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
    const t = setTimeout(() => { checkAndApply(); }, 3000);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    const sub = AppState.addEventListener("change", (state) => {
      if (state === "active") checkAndApply();
    });
    return () => sub.remove();
  }, []);

  return { checking, checkAndNotify: checkAndApply };
}
