import AsyncStorage from "@react-native-async-storage/async-storage";
import * as LocalAuthentication from "expo-local-authentication";
import { Camera } from "expo-camera";
import { Platform } from "react-native";

export const FACE_LOCK_ENABLED_KEY = "face_lock_enabled";
export const FACE_ENROLLED_AT_KEY = "face_enrolled_at";
export const FACE_FIRST_SEEN_KEY = "face_first_seen";

export type FaceSupport = {
  hasHardware: boolean;
  isEnrolled: boolean;
  supportedTypes: LocalAuthentication.AuthenticationType[];
  faceAvailable: boolean;
};

export async function getFaceSupport(): Promise<FaceSupport> {
  try {
    if (Platform.OS === "web") {
      return { hasHardware: false, isEnrolled: false, supportedTypes: [], faceAvailable: false };
    }
    const [hasHardware, isEnrolled, supportedTypes] = await Promise.all([
      LocalAuthentication.hasHardwareAsync(),
      LocalAuthentication.isEnrolledAsync(),
      LocalAuthentication.supportedAuthenticationTypesAsync(),
    ]);
    return {
      hasHardware,
      isEnrolled,
      supportedTypes,
      faceAvailable: supportedTypes.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION),
    };
  } catch {
    return { hasHardware: false, isEnrolled: false, supportedTypes: [], faceAvailable: false };
  }
}

export async function isFaceLockEnabled(): Promise<boolean> {
  try {
    return (await AsyncStorage.getItem(FACE_LOCK_ENABLED_KEY)) === "1";
  } catch {
    return false;
  }
}

export async function setFaceLockEnabled(v: boolean) {
  try {
    await AsyncStorage.setItem(FACE_LOCK_ENABLED_KEY, v ? "1" : "0");
    if (v) await AsyncStorage.setItem(FACE_ENROLLED_AT_KEY, new Date().toISOString());
  } catch {}
}

export async function markFaceFirstSeen() {
  try {
    await AsyncStorage.setItem(FACE_FIRST_SEEN_KEY, "1");
  } catch {}
}

export async function shouldShowFaceEnroll(): Promise<boolean> {
  try {
    const seen = await AsyncStorage.getItem(FACE_FIRST_SEEN_KEY);
    if (seen) return false;
    if (Platform.OS === "web") return false;
    const s = await getFaceSupport();
    return s.hasHardware && s.isEnrolled;
  } catch {
    return false;
  }
}

export async function requestCameraForFace(): Promise<boolean> {
  try {
    if (Platform.OS === "web") return false;
    const { status } = await Camera.requestCameraPermissionsAsync();
    return status === "granted";
  } catch {
    return false;
  }
}

export async function authenticateWithFace(reason: string): Promise<{ success: boolean; error?: string }> {
  try {
    if (Platform.OS === "web") return { success: true };
    const s = await getFaceSupport();
    if (!s.hasHardware || !s.isEnrolled) {
      return { success: false, error: "Aucun visage / biométrie configuré sur cet appareil." };
    }
    const res = await LocalAuthentication.authenticateAsync({
      promptMessage: reason,
      cancelLabel: "Annuler",
      fallbackLabel: "Utiliser le code",
      disableDeviceFallback: false,
    });
    if (res.success) return { success: true };
    return { success: false, error: "warning" in res ? String((res as any).warning) : "Reconnaissance annulée." };
  } catch (e: any) {
    return { success: false, error: e?.message || "Erreur biométrie." };
  }
}
