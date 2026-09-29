import { Platform } from "react-native";
// API legacy (avec progression) — la nouvelle API File/Paths n'expose pas de callback.
import {
  createDownloadResumable,
  deleteAsync,
  documentDirectory,
  getContentUriAsync,
} from "expo-file-system/legacy";
import * as IntentLauncher from "expo-intent-launcher";

// Télécharge l'APK puis ouvre l'installeur Android directement dans l'app.
// Plus de détour navigateur → fichier. 1 tap, puis l'écran système Installer.
export async function downloadAndInstallApk(
  url: string,
  onProgress?: (ratio: number) => void
): Promise<{ ok: boolean; error?: string }> {
  try {
    if (Platform.OS !== "android") return { ok: false, error: "Non supporté ici." };
    const target = (documentDirectory || "") + "akoue-update.apk";
    try {
      await deleteAsync(target, { idempotent: true });
    } catch {}
    const dl = createDownloadResumable(url, target, {}, (p) => {
      if (p.totalBytesExpectedToWrite > 0) {
        onProgress?.(p.totalBytesWritten / p.totalBytesExpectedToWrite);
      }
    });
    const res = await dl.downloadAsync();
    if (!res?.uri) return { ok: false, error: "Téléchargement échoué." };
    const contentUri = await getContentUriAsync(res.uri);
    await IntentLauncher.startActivityAsync("android.intent.action.VIEW", {
      data: contentUri,
      flags: 1,
      type: "application/vnd.android.package-archive",
    });
    return { ok: true };
  } catch (e: any) {
    return { ok: false, error: e?.message || "Installation impossible." };
  }
}
