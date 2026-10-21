import { useCallback, useEffect, useState } from "react";
import { AppState } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  getLocalLock,
  markEnrollDone,
  pullLockFromCloud,
  setAppLock,
  verifyAppLock,
  type LockMethod,
} from "@/services/app-lock-service";
import {
  authenticateWithFace,
  getFaceSupport,
  type FaceSupport,
} from "@/services/face-lock-service";
import { supabase } from "@/config/supabase";

// Choix obligatoire une fois (page plein écran) : tant que l'utilisateur
// n'a pas choisi, il est redirigé vers la page. Réinitialisable en paramètres.
const BG_AT_KEY = "app_bg_at";
const LEGACY_LOCK_DISABLED_KEY = "legacy_app_lock_disabled_v1";
// Délai de grâce : si l'app revient dans les 60s, pas de reverrouillage
// (fini l'impression d'être "déconnecté" à chaque aller-retour).
const GRACE_MS = 60 * 1000;

// Anti force brute : 5 échecs rapprochés → pause 30 secondes
const FAILS_KEY = "app_lock_fails";
const LOCKOUT_KEY = "app_lock_until";
const MAX_FAILS = 5;
const LOCKOUT_MS = 30 * 1000;
const FAIL_WINDOW_MS = 5 * 60 * 1000;

async function getLockoutSecs(): Promise<number> {
  try {
    const raw = await AsyncStorage.getItem(LOCKOUT_KEY);
    if (!raw) return 0;
    return Math.max(0, Math.ceil((Number(raw) - Date.now()) / 1000));
  } catch { return 0; }
}

async function recordFail(): Promise<number> {
  try {
    const raw = await AsyncStorage.getItem(FAILS_KEY);
    const now = Date.now();
    const fails: number[] = (raw ? JSON.parse(raw) : []).filter((t: number) => now - t < FAIL_WINDOW_MS);
    fails.push(now);
    if (fails.length >= MAX_FAILS) {
      await AsyncStorage.multiRemove([FAILS_KEY]);
      await AsyncStorage.setItem(LOCKOUT_KEY, String(now + LOCKOUT_MS));
      return Math.ceil(LOCKOUT_MS / 1000);
    }
    await AsyncStorage.setItem(FAILS_KEY, JSON.stringify(fails));
    return 0;
  } catch { return 0; }
}

async function clearFails() {
  try {
    await AsyncStorage.multiRemove([FAILS_KEY, LOCKOUT_KEY]);
  } catch {}
}

export function useAppLock() {
  const [method, setMethod] = useState<LockMethod>("none");
  const [locked, setLocked] = useState(false);
  const [lockoutSecs, setLockoutSecs] = useState(0);
  const [support, setSupport] = useState<FaceSupport | null>(null);
  const [checking, setChecking] = useState(true);

  // Resync légère (retour de la page de configuration) : ne touche pas au verrou
  const syncLock = useCallback(async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user?.id) {
        const off = (await AsyncStorage.getItem("offline_user")) || (await AsyncStorage.getItem("mock_user"));
        if (!off) {
          setLocked(false);
          return;
        }
      }
    } catch {}
    const l = await getLocalLock();
    setMethod(l.method);
  }, []);

  const refresh = useCallback(async () => {
    // Sans compte, jamais de verrou  :  sinon bloqué sur "Akouè verrouillé" après reset usine
    let hasAccount = false;
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user?.id) hasAccount = true;
    } catch {}
    if (!hasAccount) {
      try {
        const off = (await AsyncStorage.getItem("offline_user")) || (await AsyncStorage.getItem("mock_user"));
        if (off) hasAccount = true;
        else {
          const raw = await AsyncStorage.getItem("offline_users");
          const arr = raw ? JSON.parse(raw) : [];
          if (Array.isArray(arr) && arr.length > 0) hasAccount = true;
        }
      } catch {}
    }
    if (!hasAccount) {
      setMethod("none");
      setLocked(false);
      setChecking(false);
      setLockoutSecs(0);
      return;
    }
    const legacyLockDisabled = await AsyncStorage.getItem(LEGACY_LOCK_DISABLED_KEY).catch(() => null);
    if (legacyLockDisabled !== "1") {
      await setAppLock("none");
      await AsyncStorage.setItem(LEGACY_LOCK_DISABLED_KEY, "1");
    }
    if ((await AsyncStorage.getItem(LEGACY_LOCK_DISABLED_KEY).catch(() => null)) === "1") {
      setMethod("none");
      setLocked(false);
      setChecking(false);
      setLockoutSecs(0);
      return;
    }
    const [local, sup] = await Promise.all([
      getLocalLock(),
      getFaceSupport(),
    ]);
    // Si compte connecté, la base fait foi pour pin/password/pattern
    await pullLockFromCloud().catch(() => {});
    const after = await getLocalLock().catch(() => local);
    setMethod(after.method);
    setSupport(sup);
    setLocked(after.method !== "none");
    setChecking(false);
    setLockoutSecs(await getLockoutSecs());
  }, []);

  // Compte à rebours de la pause anti force brute
  useEffect(() => {
    if (lockoutSecs <= 0) return;
    const id = setInterval(async () => {
      const s = await getLockoutSecs();
      setLockoutSecs(s);
      if (s <= 0) clearInterval(id);
    }, 1000);
    return () => clearInterval(id);
  }, [lockoutSecs > 0]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    const sub = AppState.addEventListener("change", async (s) => {
      if (s === "background" || s === "inactive") {
        await AsyncStorage.setItem(BG_AT_KEY, String(Date.now())).catch(() => {});
        return;
      }
      if (s === "active") {
        const l = await getLocalLock();
        if (l.method === "none") return;
        const raw = await AsyncStorage.getItem(BG_AT_KEY).catch(() => null);
        // Absent depuis plus d'1 min (ou heure inconnue) → verrouille, sinon laisse ouvert
        if (!raw || Date.now() - Number(raw) > GRACE_MS) setLocked(true);
      }
    });
    return () => sub.remove();
  }, []);

  const unlockBiometric = useCallback(async () => {
    const wait = await getLockoutSecs();
    if (wait > 0) {
      setLockoutSecs(wait);
      return { success: false as const, error: `Trop d'essais. Réessaie dans ${wait}s.` };
    }
    const r = await authenticateWithFace("Déverrouille Akouè");
    if (r.success) {
      setLocked(false);
      await clearFails();
    } else {
      const s = await recordFail();
      if (s > 0) {
        setLockoutSecs(s);
        return { success: false as const, error: `Trop d'essais. Pause ${s}s.` };
      }
    }
    return r;
  }, []);

  const unlockSecret = useCallback(async (secret: string) => {
    const wait = await getLockoutSecs();
    if (wait > 0) {
      setLockoutSecs(wait);
      return { ok: false as const, error: `Trop d'essais. Réessaie dans ${wait}s.` };
    }
    const ok = await verifyAppLock(secret);
    if (ok) {
      setLocked(false);
      await clearFails();
      return { ok: true as const };
    }
    const s = await recordFail();
    if (s > 0) {
      setLockoutSecs(s);
      return { ok: false as const, error: `Trop d'essais. Pause ${s}s.` };
    }
    return { ok: false as const };
  }, []);

  const choose = useCallback(async (m: LockMethod, secret?: string) => {
    if (m === "biometric") {
      const r = await authenticateWithFace("Confirme pour activer le verrouillage");
      if (!r.success) return r;
    }
    await AsyncStorage.removeItem(LEGACY_LOCK_DISABLED_KEY);
    const r = await setAppLock(m, secret);
    if (!r.success) return { success: false as const, error: r.msg };
    await markEnrollDone();
    setMethod(m);
    setLocked(m !== "none");
    return { success: true as const };
  }, []);

  // Réinitialise le verrou sans imposer de nouvelle configuration.
  const resetLock = useCallback(async () => {
    await setAppLock("none");
    await AsyncStorage.setItem(LEGACY_LOCK_DISABLED_KEY, "1");
    setMethod("none");
    setLocked(false);
  }, []);

  return { method, locked, lockoutSecs, support, checking, unlockBiometric, unlockSecret, choose, resetLock, refresh, syncLock };
}
