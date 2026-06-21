// src/validators/organ.validator.ts

import { z } from 'zod';

export const organList = [
  'heart',
  'lungs',
  'liver',
  'kidney_left',
  'kidney_right',
  'pancreas',
  'intestines',
  'corneas',
  'skin',
  'bone',
  'bone_marrow',
] as const;

export const upsertOrganDonationSchema = z.object({
  organs_pledged: z.array(
    z.enum(organList)
  ).optional().default([]),
  pledge_all_organs: z.boolean().optional().default(false),
  notto_registered: z.boolean().optional().default(false),
  notto_id: z.string().optional(),
  family_informed: z.boolean().optional().default(false),
  conditions_notes: z.string().optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export type UpsertOrganDonationInput = z.infer<
  typeof upsertOrganDonationSchema
>;