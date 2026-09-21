import { z } from "zod"

export const ProfileApiSchema = {
  Update: z.object({
    name:  z.string().min(2, "Nama minimal 2 karakter"),
    email: z.string().email("Email tidak valid"),
    no_telp: z.string().optional(),
    alamat:  z.string().optional(),
  }),

  UpdatePassword: z.object({
    current_password:      z.string().min(1, "Password lama wajib diisi"),
    new_password:          z.string().min(8, "Password baru minimal 8 karakter"),
    new_password_confirmation: z.string().min(1, "Konfirmasi password wajib diisi"),
  }).refine((d) => d.new_password === d.new_password_confirmation, {
    message: "Konfirmasi password tidak cocok",
    path: ["new_password_confirmation"],
  })
}

export type ProfileFormValues = {
  Update: z.infer<typeof ProfileApiSchema.Update>
  UpdatePassword: z.infer<typeof ProfileApiSchema.UpdatePassword>
}

export const ProfileDefaultValues = {
  update: { name: "", email: "" } as ProfileFormValues['Update'],
  updatePassword: {
    current_password: "", new_password: "", new_password_confirmation: "",
  } as ProfileFormValues['UpdatePassword']
}
