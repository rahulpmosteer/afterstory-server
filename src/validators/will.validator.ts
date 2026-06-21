// src/validators/will.validator.ts

import { z } from 'zod';

// --- Will (core document) ---
export const createWillSchema = z.object({
  place_of_creation: z.string().min(2, "Place is required"),
  executor_name: z.string().min(2, "Executor name is required"),
  executor_phone: z.string()
    .regex(/^[6-9]\d{9}$/, "Enter a valid Indian mobile number"),
  executor_relationship: z.string().min(2, "Executor relationship is required"),
  witness1_name: z.string().optional(),
  witness1_address: z.string().optional(),
  witness2_name: z.string().optional(),
  witness2_address: z.string().optional(),
  special_instructions: z.string().optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export const updateWillSchema = createWillSchema.partial();

// --- Assets ---
export const createAssetSchema = z.object({
  category: z.enum([
    'property',
    'bank_account',
    'investment',
    'jewellery',
    'vehicle',
    'business',
    'digital_asset',
    'other',
  ]),
  description: z.string().min(2, "Description is required"),
  estimated_value: z.number().positive().optional(),
  location_or_details: z.string().optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export const updateAssetSchema = createAssetSchema.partial();

// --- Beneficiaries (simplified — people only) ---
export const createBeneficiarySchema = z.object({
  full_name: z.string().min(2, "Full name is required"),
  relationship: z.string().min(2, "Relationship is required"),
  phone_number: z.string()
    .regex(/^[6-9]\d{9}$/, "Enter a valid Indian mobile number")
    .optional(),
  address: z.string().optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export const updateBeneficiarySchema = createBeneficiarySchema.partial();

// --- Distribution ---
export const distributionItemSchema = z.object({
  asset_id: z.string().uuid().nullable().optional(),
  // null asset_id = simple mode (share of entire estate)
  beneficiary_id: z.string().uuid("Invalid beneficiary ID"),
  share_percentage: z.number().min(0).max(100),
});

export const saveDistributionSchema = z.object({
  mode: z.enum(['simple', 'by_asset']),
  items: z.array(distributionItemSchema).min(1, "At least one distribution is required"),
});

// --- Inferred Types ---
export type CreateWillInput = z.infer<typeof createWillSchema>;
export type UpdateWillInput = z.infer<typeof updateWillSchema>;
export type CreateAssetInput = z.infer<typeof createAssetSchema>;
export type UpdateAssetInput = z.infer<typeof updateAssetSchema>;
export type CreateBeneficiaryInput = z.infer<typeof createBeneficiarySchema>;
export type UpdateBeneficiaryInput = z.infer<typeof updateBeneficiarySchema>;
export type SaveDistributionInput = z.infer<typeof saveDistributionSchema>;
export type DistributionItemInput = z.infer<typeof distributionItemSchema>;