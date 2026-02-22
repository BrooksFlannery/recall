import { z } from "zod"

/** Sign-in form payload: parse at boundary before calling auth */
export const signInFormSchema = z.object({
  email: z.email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
})

export type SignInForm = z.infer<typeof signInFormSchema>

/** Sign-up form payload: parse at boundary before calling auth */
export const signUpFormSchema = z.object({
  name: z.string().min(1, "Name is required").trim(),
  email: z.email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
})

export type SignUpForm = z.infer<typeof signUpFormSchema>
