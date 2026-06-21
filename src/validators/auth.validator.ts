// src/validators/auth.validator.ts

import { z } from 'zod';

// --- Existing Schema (unchanged) ---
export const registerSchema = z.object({
  email: z.string().email("Invalid email format"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  full_name: z.string().min(2, "Full name is required"),
  role: z.enum(['family', 'vendor', 'staff', 'admin'], "Role must be family, vendor, staff, or admin")
});

// --- New: Login Schema ---
export const loginSchema = z.object({
  email: z.string().email("Invalid email format"),
  password: z.string().min(1, "Password is required"),
});

// --- New: Phone Verification Schema (for subscription flow later) ---
export const phoneSchema = z.object({
  phone_number: z.string()
    .min(10, "Phone number must be at least 10 digits")
    .regex(/^[6-9]\d{9}$/, "Enter a valid Indian mobile number"),
});

export const otpSchema = z.object({
  phone_number: z.string(),
  otp: z.string().length(6, "OTP must be 6 digits"),
});

// --- Inferred Types ---
export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type PhoneInput = z.infer<typeof phoneSchema>;
export type OtpInput = z.infer<typeof otpSchema>;