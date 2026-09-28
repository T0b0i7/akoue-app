import { useCallback, useEffect, useState } from "react";
import { AppState } from "react-native";
import {
  getLocalLock,
  pullLockFromCloud,
  setAppLock,
  verifyAppLock,
  type LockMethod,
} from "@/services/app-lock-service";
import {
  authenticateWithFace,
  getFaceSupport,
  markFaceFirstSeen,
  shouldShowFaceEnroll,
  type FaceSupport,
} from "@/services/face-lock-service";

export function useAppLock() {
  const [method, setMethod] = useState<LockMethod>("none");
  const [locked, setLocked] = useState(false);
  const [support, setSupport] = useState<FaceSupport | null>(null);
  const [showEnroll, setShowEnroll] = useState(false);
  const [checking, setChecking] = useState(true);

  const refresh = useCallback(async () => {
    const [local, sup, first] = await Promise.all([
      getLocalLock(),
      getFaceSupport(),
      shouldShowFaceEnroll(),
    ]);
    // Si compte connecté, la base fait foi pour pin/password/pattern
    await pullLockFromCloud().catch(() => {});
    const after = await getLocalLock().catch(() => local);
    setMethod(after.method);
    setSupport(sup);
    if (first && after.method === "none") setShowEnroll(true);
    setLocked(after.method !== "none");
    setChecking(false);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    const sub = AppState.addEventListener("change", async (s) => {
      if (s === "active") {
        const l = await getLocalLock();
        if (l.method !== "none") setLocked(true);
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
    await markFaceFirstSeen().catch(() => {});
    setMethod(m);
    setLocked(m !== "none");
    setShowEnroll(false);
    return { success: true as const };
  }, []);

  const dismissEnroll = useCallback(async () => {
    await markFaceFirstSeen().catch(() => {});
    setShowEnroll(false);
  }, []);

  return { method, locked, support, showEnroll, checking, unlockBiometric, unlockSecret, choose, dismissEnroll, refresh };
}
