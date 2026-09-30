import AsyncStorage from "@react-native-async-storage/async-storage";
import * as bcrypt from "bcryptjs";
import { supabase } from "@/config/supabase";

export type LockMethod = "none" | "biometric" | "pin" | "password" | "pattern";

const METHOD_KEY = "app_lock_method";
const HASH_KEY = "app_lock_hash";
// Choix effectué une fois (écran de configuration plein écran, pas de bottom-sheet)
const ENROLL_DONE_KEY = "app_lock_enroll_v2";

export async function isEnrollDone(): Promise<boolean> {
  try {
    return (await AsyncStorage.getItem(ENROLL_DONE_KEY)) === "1";
  } catch {
    return false;
  }
}

export async function markEnrollDone() {
  try {
    await AsyncStorage.setItem(ENROLL_DONE_KEY, "1");
  } catch {}
}

export async function clearEnrollDone() {
  try {
    await AsyncStorage.removeItem(ENROLL_DONE_KEY);
  } catch {}
}

export const LOCK_METHODS: { id: LockMethod; label: string; desc: string }[] = [
  { id: "none", label: "Aucun", desc: "Ouverture directe" },
  { id: "biometric", label: "Visage / Empreinte", desc: "FaceID / visage / doigt système. Rien stocké" },
  { id: "pin", label: "PIN", desc: "4 à 6 chiffres, hash en base" },
  { id: "password", label: "Mot de passe", desc: "8+ caractères, hash en base" },
  { id: "pattern", label: "Schéma", desc: "4+ points reliés, hash en base" },
];

export function validateSecret(method: LockMethod, secret: string): string | null {
  if (method === "pin" && !/^\d{4,6}$/.test(secret)) return "PIN : 4 à 6 chiffres.";
  if (method === "password" && secret.length < 8) return "Mot de passe : 8 caractères minimum.";
  if (method === "pattern") {
    const pts = secret.replace(/-/g, ""); // sans tirets : "2573"
    if (!/^[0-8]{4,9}$/.test(pts)) return "Schéma : glisse sur au moins 4 points.";
    if (new Set(pts).size !== pts.length) return "Schéma : un point une seule fois.";
  }
  return null;
}

async function hashSecret(secret: string): Promise<string> {
  try {
    return await bcrypt.hash(secret, 10);
  } catch {
    return secret;
  }
}

async function verifySecret(secret: string, hash: string): Promise<boolean> {
  try {
    if (hash?.startsWith("$2")) return await bcrypt.compare(secret, hash);
    return secret === hash;
  } catch {
    return secret === hash;
  }
}

export async function getLocalLock(): Promise<{ method: LockMethod; hash: string | null }> {
  try {
    const m = ((await AsyncStorage.getItem(METHOD_KEY)) || "none") as LockMethod;
    const h = await AsyncStorage.getItem(HASH_KEY);
    // Migration depuis l'ancien Face Unlock
    if (m === "none") {
      const old = await AsyncStorage.getItem("face_lock_enabled");
      if (old === "1") {
        await AsyncStorage.setItem(METHOD_KEY, "biometric");
        return { method: "biometric", hash: null };
      }
    }
    return { method: m, hash: h };
  } catch {
    return { method: "none", hash: null };
  }
}

// Enregistre la méthode + hash en local ET en base (sauf biometric : aucun secret).
// Préférable : biometric pour UX/sécurité (secret jamais stocké), PIN/password/pattern en hash bcrypt.
export async function setAppLock(method: LockMethod, secret?: string): Promise<{ success: boolean; msg?: string }> {
  if (method !== "none" && method !== "biometric") {
    if (!secret) return { success: false, msg: "Code manquant." };
    const err = validateSecret(method, secret);
    if (err) return { success: false, msg: err };
  }
  try {
    const hash = method === "none" || method === "biometric" ? null : await hashSecret(secret!);
    await AsyncStorage.setItem(METHOD_KEY, method);
    if (hash) await AsyncStorage.setItem(HASH_KEY, hash);
    else await AsyncStorage.removeItem(HASH_KEY);
    // Compat ancien flag
    await AsyncStorage.setItem("face_lock_enabled", method === "biometric" ? "1" : "0");

    // Sync base : profiles.lock_method + lock_hash (RLS : own uniquement)
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user?.id) {
        await supabase.from("profiles").upsert(
          { id: user.id, lock_method: method, lock_hash: hash, lock_updated_at: new Date().toISOString() },
          { onConflict: "id" }
        );
      }
    } catch {}
    return { success: true };
  } catch (e: any) {
    return { success: false, msg: e?.message || "Échec enregistrement." };
  }
}

// Vérifie le secret : compare au hash local d'abord (offline), sinon base.
export async function verifyAppLock(secret: string): Promise<boolean> {
  try {
    const { hash } = await getLocalLock();
    if (hash) return await verifySecret(secret, hash);
    // Fallback base (si local vidé mais session active)
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user?.id) {
        const { data } = await supabase.from("profiles").select("lock_hash").eq("id", user.id).single();
        if ((data as any)?.lock_hash) {
          const ok = await verifySecret(secret, (data as any).lock_hash);
          if (ok) await AsyncStorage.setItem(HASH_KEY, (data as any).lock_hash);
          return ok;
        }
      }
    } catch {}
    return false;
  } catch {
    return false;
  }
}

// Au login : restaure la méthode depuis la base vers le local.
export async function pullLockFromCloud(): Promise<void> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user?.id) return;
    const { data } = await supabase.from("profiles").select("lock_method,lock_hash").eq("id", user.id).single();
    if (data) {
      await AsyncStorage.setItem(METHOD_KEY, (data as any).lock_method || "none");
      if ((data as any).lock_hash) await AsyncStorage.setItem(HASH_KEY, (data as any).lock_hash);
    }
  } catch {}
}
