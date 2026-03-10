import * as usersRepository from './users.repository'
import { UpdateProfileDTO, UserProfile } from './users.type'

export const getProfile = async (id: string): Promise<UserProfile> => {
  const user = await usersRepository.findById(id)
  return {
    id: user.id,
    email: user.email!,
    fullName: user.user_metadata?.full_name ?? '',
    avatarUrl: user.user_metadata?.avatar_url ?? null,
    createdAt: user.created_at,
  }
}

export const updateProfile = async (
  id: string,
  dto: UpdateProfileDTO
): Promise<UserProfile> => {
  const user = await usersRepository.updateProfile(id, dto)
  return {
    id: user.id,
    email: user.email!,
    fullName: user.user_metadata?.full_name ?? '',
    avatarUrl: user.user_metadata?.avatar_url ?? null,
    createdAt: user.created_at,
  }
}