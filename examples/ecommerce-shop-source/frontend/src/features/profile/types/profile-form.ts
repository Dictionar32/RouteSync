/**
 * Profile Form Types - Form input types for profile feature
 */
export type ProfileForm = {
  Update: {
    name: string;
    email: string;
    no_telp?: string;
    alamat?: string;
  }

  UpdatePassword: {
    current_password: string
    new_password: string
    new_password_confirmation: string
  }
}
