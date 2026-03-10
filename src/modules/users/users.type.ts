export interface UserProfile {
  id: string
  email: string
  fullName: string
  avatarUrl: string | null
  createdAt: string
}

export interface UpdateProfileDTO {
  fullName?: string
  avatarUrl?: string
}