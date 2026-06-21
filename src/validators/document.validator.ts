// src/validators/document.validator.ts

import { z } from 'zod';

export const createDocumentSchema = z.object({
  title: z.string().min(2, "Title is required"),
  category: z.enum([
    'property',
    'insurance',
    'bank',
    'medical',
    'legal',
    'identity',
    'investment',
    'vehicle',
    'other',
  ]),
  expiry_date: z.string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be YYYY-MM-DD")
    .optional(),
  notes: z.string().optional(),
  nominee_access: z.array(z.string().uuid()).optional().default([]),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export const updateDocumentSchema = createDocumentSchema.partial();

export type CreateDocumentInput = z.infer<typeof createDocumentSchema>;
export type UpdateDocumentInput = z.infer<typeof updateDocumentSchema>;