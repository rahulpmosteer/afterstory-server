// src/services/payment.service.ts

import Razorpay from 'razorpay';
import crypto from 'crypto';
import { supabase } from '../lib/supabase.js';
import type {
  CreatePaymentOrderInput,
  VerifyPaymentInput,
} from '../validators/payment.validator.js';

let razorpayInstance: Razorpay | null = null;

export const getRazorpay = (): Razorpay => {
  if (!razorpayInstance) {
    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
      throw new Error('Razorpay environment variables are missing at runtime!');
    }
    
    razorpayInstance = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });
  }
  return razorpayInstance;
};


// const razorpay = new Razorpay({
//   key_id: process.env.RAZORPAY_KEY_ID as string,
//   key_secret: process.env.RAZORPAY_KEY_SECRET as string,
// });

export class PaymentService {

  static async createPaymentOrder(
    consumerId: string,
    data: CreatePaymentOrderInput
  ) {
    // 1. Get booking details
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .select('*')
      .eq('id', data.booking_id)
      .eq('consumer_id', consumerId)
      .single();

    if (bookingError || !booking) {
      throw new Error('Booking not found.');
    }

    if (booking.status === 'cancelled') {
      throw new Error('Cannot pay for a cancelled booking.');
    }

    // Check if already paid
    const { data: existingPayment } = await supabase
      .from('payments')
      .select('status')
      .eq('booking_id', data.booking_id)
      .eq('status', 'paid')
      .single();

    if (existingPayment) {
      throw new Error('This booking has already been paid.');
    }

    // 2. Create Razorpay order
    const amountInPaise = Math.round(
      Number(booking.total_amount) * 100
    );

    const razorpay = getRazorpay();

    const order = await razorpay.orders.create({
      amount: amountInPaise,
      currency: 'INR',
      receipt: `booking_${data.booking_id}`,
      notes: {
        booking_id: data.booking_id,
        consumer_id: consumerId,
      },
    });

    // 3. Save payment record
    const { data: payment, error: paymentError } = await supabase
      .from('payments')
      .insert({
        booking_id: data.booking_id,
        consumer_id: consumerId,
        razorpay_order_id: order.id,
        amount: booking.total_amount,
        currency: 'INR',
        status: 'pending',
      })
      .select()
      .single();

    if (paymentError) throw new Error(paymentError.message);

    return {
      payment_id: payment.id,
      razorpay_order_id: order.id,
      amount: amountInPaise,
      currency: 'INR',
      key_id: process.env.RAZORPAY_KEY_ID,
    };
  }

  static async verifyPayment(
    consumerId: string,
    data: VerifyPaymentInput
  ) {
    // 1. Verify Razorpay signature
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET!)
      .update(`${data.razorpay_order_id}|${data.razorpay_payment_id}`)
      .digest('hex');

    if (expectedSignature !== data.razorpay_signature) {
      throw new Error('Invalid payment signature. Payment verification failed.');
    }

    // 2. Update payment record
    const { error: paymentError } = await supabase
      .from('payments')
      .update({
        razorpay_payment_id: data.razorpay_payment_id,
        status: 'paid',
        paid_at: new Date().toISOString(),
      })
      .eq('razorpay_order_id', data.razorpay_order_id)
      .eq('consumer_id', consumerId);

    if (paymentError) throw new Error(paymentError.message);

    // 3. Update booking status to confirmed
    const { error: bookingError } = await supabase
      .from('bookings')
      .update({
        status: 'confirmed',
        updated_at: new Date().toISOString(),
      })
      .eq('id', data.booking_id)
      .eq('consumer_id', consumerId);

    if (bookingError) throw new Error(bookingError.message);

    return { message: 'Payment verified and booking confirmed.' };
  }

  static async getPaymentHistory(consumerId: string) {
    const { data, error } = await supabase
      .from('payments')
      .select(`
        *,
        bookings (
          id,
          status,
          service_listings (
            title,
            category
          )
        )
      `)
      .eq('consumer_id', consumerId)
      .order('created_at', { ascending: false });

    if (error) throw new Error(error.message);
    return data ?? [];
  }
}