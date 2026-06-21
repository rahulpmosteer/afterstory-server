// src/validators/vendor.validator.ts

import { z } from 'zod';

const workingHoursSchema = z.object({
  monday: z.object({
    open: z.boolean(),
    start: z.string().optional(),
    end: z.string().optional(),
  }).optional(),
  tuesday: z.object({
    open: z.boolean(),
    start: z.string().optional(),
    end: z.string().optional(),
  }).optional(),
  wednesday: z.object({
    open: z.boolean(),
    start: z.string().optional(),
    end: z.string().optional(),
  }).optional(),
  thursday: z.object({
    open: z.boolean(),
    start: z.string().optional(),
    end: z.string().optional(),
  }).optional(),
  friday: z.object({
    open: z.boolean(),
    start: z.string().optional(),
    end: z.string().optional(),
  }).optional(),
  saturday: z.object({
    open: z.boolean(),
    start: z.string().optional(),
    end: z.string().optional(),
  }).optional(),
  sunday: z.object({
    open: z.boolean(),
    start: z.string().optional(),
    end: z.string().optional(),
  }).optional(),
}).optional();

export const upsertVendorMetadataSchema = z.object({
  // Business details
  business_name: z.string().min(2, "Business name is required").optional(),
  business_type: z.enum([
    'sole_proprietor',
    'partnership',
    'private_limited',
    'public_limited',
    'trust',
    'ngo',
    'other',
  ]).optional(),
  business_address: z.string().optional(),
  business_phone: z.string()
    .regex(/^[6-9]\d{9}$/, "Enter a valid Indian mobile number")
    .optional(),
  business_email: z.string().email("Invalid email").optional(),

  // KYC
  aadhaar_number: z.string()
    .length(12, "Aadhaar must be 12 digits")
    .optional(),
  pan_number: z.string()
    .regex(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/, "Invalid PAN format")
    .optional(),
  gst_number: z.string()
    .regex(
      /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/,
      "Invalid GST number format"
    )
    .optional(),
  medical_license_no: z.string().optional(),

  // Location
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  service_radius_meters: z.number().min(1000).max(500000).optional(),
  languages_spoken: z.array(z.string()).optional(),

  // Bank details
  bank_account_name: z.string().optional(),
  bank_name: z.string().optional(),
  bank_account_number: z.string().optional(),
  bank_ifsc: z.string()
    .regex(/^[A-Z]{4}0[A-Z0-9]{6}$/, "Invalid IFSC code format")
    .optional(),
  upi_id: z.string().optional(),

  // Working hours
  working_hours: workingHoursSchema,

  metadata: z.record(z.string(), z.unknown()).optional(),
});

export type UpsertVendorMetadataInput = z.infer<
  typeof upsertVendorMetadataSchema
>;