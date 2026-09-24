import { supabase } from "@/config/supabase";

const ALLOWED_EXT = ["jpg", "jpeg", "png", "webp"] as const;
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

function isValidMagicBytes(buf: ArrayBuffer, ext: string): boolean {
  const bytes = new Uint8Array(buf.slice(0, 8));
  // JPEG: FF D8 FF
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return true;
  // PNG: 89 50 4E 47
  if (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47) return true;
  // WEBP: 52 49 46 46 ... 57 45 42 50
  if (bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46) return true;
  // si ext est jpg/jpeg on accepte aussi si pas de magic strict (blob RN peut être différent)
  if (ext === "jpg" || ext === "jpeg") return bytes[0] === 0xff;
  return false;
}

export const uploadFileToSupabase = async (
  file: { uri?: string } | string,
  folderName: string
): Promise<any> => {
  try {
    if (!file) return { success: true, data: null };
    if (typeof file === "string") return { success: true, data: file };
    if (typeof file !== "string" && file.uri) {
      const uri = file.uri;
      let ext = "jpg";
      if (uri.startsWith("blob:") || uri.startsWith("data:")) {
        ext = uri.includes("png") ? "png" : "jpg";
      } else {
        const clean = uri.split("?")[0].split("#")[0];
        const last = clean.split("/").pop() || "";
        const maybeExt = last.includes(".") ? last.split(".").pop() : "";
        if (maybeExt && ALLOWED_EXT.includes(maybeExt.toLowerCase() as any)) ext = maybeExt.toLowerCase();
        else if (maybeExt) return { success: false, msg: `Type de fichier non autorisé: .${maybeExt}` };
      }
      if (!ALLOWED_EXT.includes(ext as any)) return { success: false, msg: "Type non autorisé (jpg, png, webp uniquement)" };

      const response = await fetch(uri);
      const arrayBuffer = await response.arrayBuffer();
      if (arrayBuffer.byteLength > MAX_FILE_SIZE) return { success: false, msg: "Fichier trop volumineux (>5Mo)" };
      if (arrayBuffer.byteLength < 12) return { success: false, msg: "Fichier invalide" };
      // vérif magic bytes (hors data: qui peut être encodé différemment)
      if (!uri.startsWith("data:") && !isValidMagicBytes(arrayBuffer, ext)) {
        return { success: false, msg: "Fichier image invalide" };
      }

      // sécurise le chemin: préfixe par uid pour respecter RLS storage.foldername[1] = uid
      let safeFolder = folderName;
      try {
        const { data: { user } } = await supabase.auth.getUser();
        const uid = user?.id;
        if (uid) safeFolder = `${uid}/${folderName}`;
      } catch {}
      const fileName = `${safeFolder}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

      const { error } = await supabase.storage.from("receipts").upload(fileName, arrayBuffer, {
        contentType: `image/${ext === "jpg" ? "jpeg" : ext}`,
        upsert: false,
      });
      if (error) return { success: false, msg: error.message };

      // bucket désormais privé → URL signée (1h) sinon fallback public (compat)
      try {
        const { data: signed, error: signErr } = await supabase.storage.from("receipts").createSignedUrl(fileName, 3600);
        if (!signErr && signed?.signedUrl) return { success: true, data: signed.signedUrl };
      } catch {}
      const { data } = supabase.storage.from("receipts").getPublicUrl(fileName);
      return { success: true, data: data.publicUrl };
    }
    return { success: true, data: null };
  } catch (error: any) {
    console.log("upload error:", error);
    return { success: false, msg: error.message || "Could not upload file." };
  }
};

// Legacy alias for migrated services
export const uploadFileToCloudinary = uploadFileToSupabase;

export const getProfileImage = (file: any) => {
  if (file === "male") return require("../public/images/defaultAvatar.png");
  if (file === "female") return require("../public/images/profile.png");
  if (file && typeof file === "string" && file.startsWith("http")) return { uri: file };
  if (file && typeof file === "string" && file.startsWith("icon:")) return null;
  if (file && typeof file === "string") return file;
  if (file && typeof file === "object") return file.uri;
  return require("../public/images/defaultAvatar.png");
};

export const getFilePath = (file: any) => {
  if (file && typeof file === "string") return file;
  if (file && typeof file === "object") return file.uri;
  return null;
};

export const isIconString = (value: any) => typeof value === "string" && value.startsWith("icon:");

export const getWalletIconData = (value: any) => {
  if (!isIconString(value)) return null;
  const [, id, color] = (value as string).split(":");
  return { id: id || "wallet", color: color || "#7A4DFF" };
};
