// src/validators/profile.validator.ts

import { z } from 'zod';

// --- Existing Schemas (unchanged) ---
export const vendorOnboardingSchema = z.object({
  business_name: z.string().min(2, "Business name is required"),
  category: z.enum([
    'ambulance', 'medical_staff', 'hearse', 'cold_storage',
    'priest', 'cremation_ground', 'burial_site', 'embalmer',
    'florist', 'catering', 'music_choir',
    'legal_advocate', 'grief_counselor'
  ]),
  aadhaar_number: z.string().length(12, "Aadhaar must be 12 digits").optional(),
  medical_license_no: z.string().optional(),
});

export const consumerOnboardingSchema = z.object({
  religion: z.string().optional(),
  mother_tongue: z.string().optional(),
  emergency_contact_name: z.string().optional(),
  emergency_contact_phone: z.string().optional(),
});

// --- New: Update personal profile schema ---
export const updateProfileSchema = z.object({
  full_name: z.string().min(2, "Full name is required").optional(),
  phone_number: z.string()
    .regex(/^[6-9]\d{9}$/, "Enter a valid Indian mobile number")
    .optional(),
});

// --- New: Update consumer metadata schema ---
export const updateConsumerMetadataSchema = z.object({
  religion: z.string().optional(),
  community: z.string().optional(),
  mother_tongue: z.string().optional(),
  date_of_birth: z.string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format")
    .optional(),
  gender: z.enum(['male', 'female', 'other']).optional(),
  blood_group: z.enum([
    'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'
  ]).optional(),
  state: z.string().optional(),
  city: z.string().optional(),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  emergency_contact_name: z.string().optional(),
  emergency_contact_phone: z.string()
    .regex(/^[6-9]\d{9}$/, "Enter a valid Indian mobile number")
    .optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

// --- New: Nominee schemas ---
export const createNomineeSchema = z.object({
  full_name: z.string().min(2, "Full name is required"),
  relationship: z.enum([
    'spouse', 'child', 'parent', 'sibling', 'friend', 'other'
  ], { message: "Invalid relationship type" }),
  phone_number: z.string()
    .regex(/^[6-9]\d{9}$/, "Enter a valid Indian mobile number")
    .optional(),
  email: z.string().email("Invalid email").optional(),
  aadhaar_number: z.string()
    .length(12, "Aadhaar must be 12 digits")
    .optional(),
  is_primary: z.boolean().optional().default(false),
  access_level: z.enum(['view', 'full']).optional().default('view'),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export const vendorServiceSchema = z.object({
  category: z.enum([
    'ambulance', 'medical_staff', 'hearse', 'cold_storage',
    'priest', 'cremation_ground', 'burial_site', 'embalmer',
    'florist', 'catering', 'music_choir',
    'legal_advocate', 'grief_counselor'
  ]),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export const reviewVendorServiceSchema = z.object({
  status: z.enum(['approved', 'rejected']),
  rejection_reason: z.string().optional(),
});

export type VendorServiceInput = z.infer<typeof vendorServiceSchema>;
export type ReviewVendorServiceInput = z.infer<typeof reviewVendorServiceSchema>;

export const updateNomineeSchema = createNomineeSchema.partial();

// --- Inferred Types ---
export type VendorOnboardingInput = z.infer<typeof vendorOnboardingSchema>;
export type ConsumerOnboardingInput = z.infer<typeof consumerOnboardingSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type UpdateConsumerMetadataInput = z.infer<typeof updateConsumerMetadataSchema>;
export type CreateNomineeInput = z.infer<typeof createNomineeSchema>;
export type UpdateNomineeInput = z.infer<typeof updateNomineeSchema>;