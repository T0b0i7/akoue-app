import { supabase } from "@/config/supabase";
import { UserDataType, ResponseType } from "../types";
import { uploadFileToSupabase } from "./images-service";

export const updateUser = async (uid: string, updatedData: UserDataType): Promise<ResponseType> => {
  try {
    if (updatedData.image && (updatedData as any)?.image?.uri) {
      const res = await uploadFileToSupabase((updatedData as any).image, `${uid}`);
      if (!res.success) return { success: false, msg: res.msg || "Failed to upload image." };
      updatedData.image = res.data;
    }
    const { error } = await supabase.from("profiles").update({ name: updatedData.name, image: updatedData.image }).eq("id", uid);
    if (error) return { success: false, msg: error.message };

    // Also sync auth metadata for quick display
    await supabase.auth.updateUser({ data: { name: updatedData.name, avatar_url: updatedData.image } });
    return { success: true, msg: "Updated Successfully" };
  } catch (error: any) {
    return { success: false, msg: error.message };
  }
};
