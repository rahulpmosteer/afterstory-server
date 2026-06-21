// src/validators/payment.validator.ts

import { z } from 'zod';

export const createPaymentOrderSchema = z.object({
  booking_id: z.string().uuid("Invalid booking ID"),
});

export const verifyPaymentSchema = z.object({
  booking_id: z.string().uuid("Invalid booking ID"),
  razorpay_order_id: z.string(),
  razorpay_payment_id: z.string(),
  razorpay_signature: z.string(),
});

export type CreatePaymentOrderInput = z.infer<typeof createPaymentOrderSchema>;
export type VerifyPaymentInput = z.infer<typeof verifyPaymentSchema>;