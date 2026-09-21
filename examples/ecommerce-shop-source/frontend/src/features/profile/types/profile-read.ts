/**
 * Profile Read Types - API response types for profile feature
 */
export type UserProfile = {
  id: number
  name: string
  email: string
}

export type ProfileIndex = UserProfile;
export type ProfileShow = UserProfile;
