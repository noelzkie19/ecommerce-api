import { supabaseAdmin } from "../../config/supabase";
import { AppError } from "../../common/utils/AppError";

interface UpdateProfileDTO {
  fullName?: string;
  avatarUrl?: string;
}

export const findById = async (id: string) => {
  const { data, error } = await supabaseAdmin.auth.admin.getUserById(id);
  if (error) throw new AppError("User not found", 404);
  return data.user;
};

export const updateProfile = async (id: string, dto: UpdateProfileDTO) => {
  const { data, error } = await supabaseAdmin.auth.admin.updateUserById(id, {
    user_metadata: {
      full_name: dto.fullName,
      avatar_url: dto.avatarUrl,
    },
  });
  if (error) throw new AppError(error.message, 400);
  return data.user;
};
