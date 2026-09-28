import { useCallback, useEffect, useState } from "react";
import { AppState } from "react-native";
import {
  authenticateWithFace,
  getFaceSupport,
  isFaceLockEnabled,
  markFaceFirstSeen,
  setFaceLockEnabled,
  shouldShowFaceEnroll,
  type FaceSupport,
} from "@/services/face-lock-service";

export function useFaceLock() {
  const [enabled, setEnabled] = useState(false);
  const [locked, setLocked] = useState(false);
  const [support, setSupport] = useState<FaceSupport | null>(null);
  const [showEnroll, setShowEnroll] = useState(false);
  const [checking, setChecking] = useState(true);

  const refresh = useCallback(async () => {
    const [en, sup, first] = await Promise.all([
      isFaceLockEnabled(),
      getFaceSupport(),
      shouldShowFaceEnroll(),
    ]);
    setEnabled(en);
    setSupport(sup);
    if (first) setShowEnroll(true);
    setLocked(en);
    setChecking(false);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  // Re-verrouille quand l'app revient au premier plan
  useEffect(() => {
    const sub = AppState.addEventListener("change", async (s) => {
      if (s === "active") {
        const en = await isFaceLockEnabled();
        if (en) setLocked(true);
      }
    });
    return () => sub.remove();
  }, []);

  const unlock = useCallback(async () => {
    const r = await authenticateWithFace("Déverrouille Akouè avec ton visage");
    if (r.success) setLocked(false);
    return r;
  }, []);

  const enable = useCallback(async () => {
    const r = await authenticateWithFace("Confirme ton visage pour activer Face Unlock");
    if (!r.success) return r;
    await setFaceLockEnabled(true);
    await markFaceFirstSeen();
    setEnabled(true);
    setLocked(false);
    setShowEnroll(false);
    return { success: true };
  }, []);

  const disable = useCallback(async () => {
    await setFaceLockEnabled(false);
    setEnabled(false);
    setLocked(false);
  }, []);

  const dismissEnroll = useCallback(async () => {
    await markFaceFirstSeen();
    setShowEnroll(false);
  }, []);

  return { enabled, locked, support, showEnroll, checking, unlock, enable, disable, dismissEnroll, refresh };
}
