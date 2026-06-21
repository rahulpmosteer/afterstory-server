// src/validators/marketplace.validator.ts

import { z } from 'zod';

export const createListingSchema = z.object({
  category: z.enum([
    'ambulance', 'medical_staff', 'hearse', 'cold_storage',
    'priest', 'cremation_ground', 'burial_site', 'embalmer',
    'florist', 'catering', 'music_choir',
    'legal_advocate', 'grief_counselor',
  ]),
  title: z.string().min(2, "Title is required"),
  description: z.string().optional(),
  base_price: z.number().positive("Price must be greater than 0"),
  price_unit: z.enum([
    'fixed', 'per_hour', 'per_day', 'per_km'
  ]).default('fixed'),
  is_active: z.boolean().default(true),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export const updateListingSchema = createListingSchema.partial();

export const createBookingSchema = z.object({
  listing_id: z.string().uuid("Invalid listing ID"),
  scheduled_at: z.string().datetime("Invalid date format").optional(),
  notes: z.string().optional(),
});

export const updateBookingStatusSchema = z.object({
  status: z.enum([
    'confirmed', 'in_progress', 'completed', 'cancelled'
  ]),
});

export const updateCommissionSchema = z.object({
  category: z.enum([
    'ambulance', 'medical_staff', 'hearse', 'cold_storage',
    'priest', 'cremation_ground', 'burial_site', 'embalmer',
    'florist', 'catering', 'music_choir',
    'legal_advocate', 'grief_counselor',
  ]),
  commission_percentage: z.number().min(0).max(100),
});

export type CreateListingInput = z.infer<typeof createListingSchema>;
export type UpdateListingInput = z.infer<typeof updateListingSchema>;
export type CreateBookingInput = z.infer<typeof createBookingSchema>;
export type UpdateBookingStatusInput = z.infer<typeof updateBookingStatusSchema>;
export type UpdateCommissionInput = z.infer<typeof updateCommissionSchema>;