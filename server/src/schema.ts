import { z } from 'zod';

// User schema for database representation
export const userSchema = z.object({
  id: z.number(),
  email: z.string().email(),
  password_hash: z.string(),
  created_at: z.coerce.date()
});

export type User = z.infer<typeof userSchema>;

// Input schema for user signup
export const signupInputSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters long'),
  confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"]
});

export type SignupInput = z.infer<typeof signupInputSchema>;

// Response schema for successful signup
export const signupResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  user: z.object({
    id: z.number(),
    email: z.string().email()
  }).optional()
});

export type SignupResponse = z.infer<typeof signupResponseSchema>;