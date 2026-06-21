// src/services/rating.service.ts

import { supabase } from '../lib/supabase.js';
import type { CreateRatingInput } from '../validators/rating.validator.js';

export class RatingService {

  static async createRating(
    consumerId: string,
    data: CreateRatingInput
  ) {
    // 1. Verify booking exists, belongs to consumer, and is completed
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .select('id, vendor_id, consumer_id, status')
      .eq('id', data.booking_id)
      .eq('consumer_id', consumerId)
      .single();

    if (bookingError || !booking) {
      throw new Error('Booking not found.');
    }

    if (booking.status !== 'completed') {
      throw new Error(
        'You can only rate a vendor after the booking is completed.'
      );
    }

    // 2. Check if already rated
    const { data: existing } = await supabase
      .from('vendor_ratings')
      .select('id')
      .eq('booking_id', data.booking_id)
      .single();

    if (existing) {
      throw new Error('You have already rated this booking.');
    }

    // 3. Create rating
    const { data: rating, error } = await supabase
      .from('vendor_ratings')
      .insert({
        vendor_id: booking.vendor_id,
        consumer_id: consumerId,
        booking_id: data.booking_id,
        rating: data.rating,
        review: data.review ?? null,
      })
      .select()
      .single();

    if (error) throw new Error(error.message);
    return rating;
  }

  static async getVendorRatings(vendorId: string) {
    const { data, error } = await supabase
      .from('vendor_ratings')
      .select(`
        *,
        profiles!vendor_ratings_consumer_id_fkey (
          full_name
        )
      `)
      .eq('vendor_id', vendorId)
      .order('created_at', { ascending: false });

    if (error) throw new Error(error.message);

    const ratings = data ?? [];
    const average = ratings.length > 0
      ? ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length
      : 0;

    return {
      ratings,
      average_rating: Math.round(average * 10) / 10,
      total_ratings: ratings.length,
    };
  }

  static async getBookingRating(
    consumerId: string,
    bookingId: string
  ) {
    const { data } = await supabase
      .from('vendor_ratings')
      .select('*')
      .eq('booking_id', bookingId)
      .eq('consumer_id', consumerId)
      .single();

    return data ?? null;
  }
}