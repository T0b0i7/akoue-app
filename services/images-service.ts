import { supabase } from "@/config/supabase";

export const uploadFileToSupabase = async (
  file: { uri?: string } | string,
  folderName: string
): Promise<any> => {
  try {
    if (!file) return { success: true, data: null };
    if (typeof file === "string") return { success: true, data: file };
    if (typeof file !== "string" && file.uri) {
      const uri = file.uri;
      const ext = uri.split(".").pop()?.split("?")[0] || "jpg";
      const fileName = `${folderName}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

      // Fetch as blob/arrayBuffer for React Native
      const response = await fetch(uri);
      const arrayBuffer = await response.arrayBuffer();

      const { error } = await supabase.storage.from("receipts").upload(fileName, arrayBuffer, {
        contentType: `image/${ext === "jpg" ? "jpeg" : ext}`,
        upsert: false,
      });
      if (error) return { success: false, msg: error.message };

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
  if (file && typeof file === "string") return file;
  if (file && typeof file === "object") return file.uri;
  return require("../public/images/defaultAvatar.png");
};

export const getFilePath = (file: any) => {
  if (file && typeof file === "string") return file;
  if (file && typeof file === "object") return file.uri;
  return null;
};
