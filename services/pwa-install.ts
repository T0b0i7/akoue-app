import AsyncStorage from "@react-native-async-storage/async-storage";

const PENDING_PREFIX = "pwa_install_pending:";
const DISMISSED_PREFIX = "pwa_install_dismissed:";

function getKeys(email: string) {
  const normalizedEmail = email.trim().toLowerCase();
  return {
    pending: `${PENDING_PREFIX}${normalizedEmail}`,
    dismissed: `${DISMISSED_PREFIX}${normalizedEmail}`,
  };
}

export async function markPwaInstallPending(email: string) {
  if (!email) return;
  const { pending } = getKeys(email);
  try {
    await AsyncStorage.setItem(pending, "1");
  } catch (error) {
    console.warn("[pwa] Impossible d'enregistrer l'invitation :", error);
  }
}

export async function clearPwaInstallPending(email: string) {
  if (!email) return;
  const { pending } = getKeys(email);
  try {
    await AsyncStorage.removeItem(pending);
  } catch (error) {
    console.warn("[pwa] Impossible de retirer l'invitation :", error);
  }
}

export async function getPwaInstallPromptState(email: string) {
  const keys = getKeys(email);
  const values = await AsyncStorage.multiGet([keys.pending, keys.dismissed]);
  return {
    pending: values[0]?.[1] === "1",
    dismissed: values[1]?.[1] === "1",
  };
}

export async function dismissPwaInstallPrompt(email: string) {
  if (!email) return;
  const { pending, dismissed } = getKeys(email);
  try {
    await AsyncStorage.multiSet([[dismissed, "1"], [pending, "0"]]);
  } catch (error) {
    console.warn("[pwa] Impossible d'enregistrer la fermeture de l'invitation :", error);
  }
}
