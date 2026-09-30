import { useCallback, useEffect, useState } from "react";
import { AppState } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  clearEnrollDone,
  getLocalLock,
  isEnrollDone,
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

// Choix obligatoire une fois (page plein écran) : tant que l'utilisateur
// n'a pas choisi, il est redirigé vers la page. Réinitialisable en paramètres.
const BG_AT_KEY = "app_bg_at";
// Délai de grâce : si l'app revient dans les 60s, pas de reverrouillage
// (fini l'impression d'être "déconnecté" à chaque aller-retour).
const GRACE_MS = 60 * 1000;

export function useAppLock() {
  const [method, setMethod] = useState<LockMethod>("none");
  const [locked, setLocked] = useState(false);
  const [support, setSupport] = useState<FaceSupport | null>(null);
  const [showEnroll, setShowEnroll] = useState(false);
  const [checking, setChecking] = useState(true);

  // Resync légère (retour de la page de configuration) : ne touche pas au verrou
  const syncEnroll = useCallback(async () => {
    const [l, done] = await Promise.all([getLocalLock(), isEnrollDone()]);
    setMethod(l.method);
    setShowEnroll(l.method === "none" && !done);
  }, []);

  const refresh = useCallback(async () => {
    const [local, sup] = await Promise.all([
      getLocalLock(),
      getFaceSupport(),
    ]);
    // Si compte connecté, la base fait foi pour pin/password/pattern
    await pullLockFromCloud().catch(() => {});
    const after = await getLocalLock().catch(() => local);
    const done = await isEnrollDone();
    setMethod(after.method);
    setSupport(sup);
    if (after.method === "none" && !done) setShowEnroll(true);
    setLocked(after.method !== "none");
    setChecking(false);
  }, []);

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
    const r = await authenticateWithFace("Déverrouille Akouè");
    if (r.success) setLocked(false);
    return r;
  }, []);

  const unlockSecret = useCallback(async (secret: string) => {
    const ok = await verifyAppLock(secret);
    if (ok) setLocked(false);
    return ok;
  }, []);

  const choose = useCallback(async (m: LockMethod, secret?: string) => {
    if (m === "biometric") {
      const r = await authenticateWithFace("Confirme pour activer le verrouillage");
      if (!r.success) return r;
    }
    const r = await setAppLock(m, secret);
    if (!r.success) return { success: false as const, error: r.msg };
    await markEnrollDone();
    setMethod(m);
    setLocked(m !== "none");
    setShowEnroll(false);
    return { success: true as const };
  }, []);

  // Réinitialise : efface le verrou, la page de choix sera redemandée
  const resetLock = useCallback(async () => {
    await setAppLock("none");
    await clearEnrollDone();
    setMethod("none");
    setLocked(false);
    setShowEnroll(true);
  }, []);

  return { method, locked, support, showEnroll, checking, unlockBiometric, unlockSecret, choose, resetLock, refresh, syncEnroll };
}
