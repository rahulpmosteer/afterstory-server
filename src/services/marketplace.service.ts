// src/services/marketplace.service.ts

import { supabase } from '../lib/supabase.js';
import type {
  CreateListingInput,
  UpdateListingInput,
  CreateBookingInput,
  UpdateBookingStatusInput,
  UpdateCommissionInput,
} from '../validators/marketplace.validator.js';

export class MarketplaceService {

  // --- Service Listings ---

  static async getListings(filters: {
    category?: string;
    search?: string;
    latitude?: number;
    longitude?: number;
    radius_meters?: number;
  }) {
    let query = supabase
      .from('service_listings')
      .select(`
        *,
        profiles!service_listings_vendor_id_fkey (
          id,
          full_name,
          phone_number
        )
      `)
      .eq('is_active', true);

    if (filters.category) {
      query = query.eq('category', filters.category);
    }

    if (filters.search) {
      query = query.or(
        `title.ilike.%${filters.search}%,description.ilike.%${filters.search}%`
      );
    }

    const { data, error } = await query
      .order('average_rating', { ascending: false })
      .order('created_at', { ascending: false });

    if (error) {
      console.error('getListings error:', error);
      throw new Error(error.message);
    }

    const listings = data ?? [];
    if (listings.length === 0) return [];

    // Fetch vendor metadata separately
    const vendorIds = [...new Set(listings.map((l: any) => l.vendor_id))];
    const { data: vendorMetadata } = await supabase
      .from('vendor_metadata')
      .select(`
        profile_id,
        business_name,
        latitude,
        longitude,
        service_radius_meters,
        languages_spoken,
        working_hours
      `)
      .in('profile_id', vendorIds);

    // Map vendor metadata onto listings
    const metadataMap = new Map(
      (vendorMetadata ?? []).map((vm: any) => [vm.profile_id, vm])
    );

    return listings.map((listing: any) => ({
      ...listing,
      vendor_metadata: metadataMap.get(listing.vendor_id) ?? null,
    }));
  }

  static async getListing(listingId: string) {
    const { data, error } = await supabase
      .from('service_listings')
      .select(`
        *,
        profiles!service_listings_vendor_id_fkey (
          id,
          full_name,
          phone_number
        )
      `)
      .eq('id', listingId)
      .single();

    if (error) {
      console.error('getListing error:', error);
      throw new Error(error.message);
    }

    if (!data) throw new Error('Listing not found.');

    // Fetch vendor metadata separately
    const { data: vendorMetadata } = await supabase
      .from('vendor_metadata')
      .select(`
        profile_id,
        business_name,
        latitude,
        longitude,
        service_radius_meters,
        languages_spoken,
        working_hours
      `)
      .eq('profile_id', data.vendor_id)
      .single();

    return {
      ...data,
      vendor_metadata: vendorMetadata ?? null,
    };
  }

  static async getVendorListings(vendorId: string) {
    const { data, error } = await supabase
      .from('service_listings')
      .select('*')
      .eq('vendor_id', vendorId)
      .order('created_at', { ascending: false });
      

    if (error) throw new Error(error.message);
    return data ?? [];
  }

  static async createListing(
    vendorId: string,
    data: CreateListingInput
  ) {
    // Verify vendor has approved service for this category
    const { data: service, error: serviceError } = await supabase
      .from('vendor_services')
      .select('id')
      .eq('vendor_id', vendorId)
      .eq('category', data.category)
      .eq('status', 'approved')
      .single();

    if (serviceError || !service) {
      throw new Error(
        `Your ${data.category} service has not been approved yet. `
        + 'Please wait for admin approval before creating listings.'
      );
    }

    const { data: listing, error } = await supabase
      .from('service_listings')
      .insert({
        vendor_id: vendorId,
        ...data,
      })
      .select()
      .single();

    if (error) throw new Error(error.message);
    return listing;
  }

  static async updateListing(
    vendorId: string,
    listingId: string,
    data: UpdateListingInput
  ) {
    const { data: listing, error } = await supabase
      .from('service_listings')
      .update({
        ...data,
        updated_at: new Date().toISOString(),
      })
      .eq('id', listingId)
      .eq('vendor_id', vendorId)
      .select()
      .single();

    if (error) throw new Error(error.message);
    if (!listing) throw new Error('Listing not found.');
    return listing;
  }

  static async deleteListing(vendorId: string, listingId: string) {
    const { error } = await supabase
      .from('service_listings')
      .delete()
      .eq('id', listingId)
      .eq('vendor_id', vendorId);

    if (error) throw new Error(error.message);
    return { message: 'Listing deleted successfully.' };
  }

  // --- Bookings ---

  static async createBooking(
    consumerId: string,
    data: CreateBookingInput
  ) {
    // 1. Get listing details
    const { data: listing, error: listingError } = await supabase
      .from('service_listings')
      .select('*')
      .eq('id', data.listing_id)
      .eq('is_active', true)
      .single();

    if (listingError || !listing) {
      throw new Error('Listing not found or no longer available.');
    }

    // 2. Get commission rate for this category
    const { data: commission } = await supabase
      .from('commission_config')
      .select('commission_percentage')
      .eq('category', listing.category)
      .eq('is_active', true)
      .single();

    const commissionPercentage = commission?.commission_percentage ?? 15;
    const baseAmount = Number(listing.base_price);
    const commissionAmount = (baseAmount * commissionPercentage) / 100;
    const vendorAmount = baseAmount - commissionAmount;
    const totalAmount = baseAmount;

    // 3. Create booking
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .insert({
        consumer_id: consumerId,
        vendor_id: listing.vendor_id,
        listing_id: data.listing_id,
        status: 'pending',
        scheduled_at: data.scheduled_at ?? null,
        notes: data.notes ?? null,
        base_amount: baseAmount,
        commission_percentage: commissionPercentage,
        commission_amount: commissionAmount,
        vendor_amount: vendorAmount,
        total_amount: totalAmount,
      })
      .select()
      .single();

    if (bookingError) throw new Error(bookingError.message);
    return booking;
  }

  static async getConsumerBookings(consumerId: string) {
    const { data, error } = await supabase
      .from('bookings')
      .select(`
        *,
        service_listings (
          title,
          category,
          price_unit
        ),
        profiles!bookings_vendor_id_fkey (
          full_name,
          phone_number
        ),
        payments (
          status,
          razorpay_payment_id,
          paid_at
        )
      `)
      .eq('consumer_id', consumerId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('getConsumerBookings error:', error);
      throw new Error(error.message);
    }

    const bookings = data ?? [];
    if (bookings.length === 0) return [];

    // Fetch vendor metadata separately
    const vendorIds = [...new Set(bookings.map((b: any) => b.vendor_id))];
    const { data: vendorMetadata } = await supabase
      .from('vendor_metadata')
      .select('profile_id, business_name')
      .in('profile_id', vendorIds);

    const metadataMap = new Map(
      (vendorMetadata ?? []).map((vm: any) => [vm.profile_id, vm])
    );

    return bookings.map((booking: any) => ({
      ...booking,
      vendor_metadata: metadataMap.get(booking.vendor_id) ?? null,
    }));
  }

  static async getVendorBookings(vendorId: string) {
    const { data, error } = await supabase
      .from('bookings')
      .select(`
        *,
        service_listings (
          title,
          category,
          price_unit
        ),
        profiles!bookings_consumer_id_fkey (
          full_name,
          phone_number
        ),
        payments (
          status,
          paid_at
        )
      `)
      .eq('vendor_id', vendorId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('getVendorBookings error:', error);
      throw new Error(error.message);
    }

    return data ?? [];
  }

  static async updateBookingStatus(
    userId: string,
    bookingId: string,
    data: UpdateBookingStatusInput
  ) {
    // Verify user owns this booking
    const { data: booking, error: fetchError } = await supabase
      .from('bookings')
      .select('consumer_id, vendor_id, status')
      .eq('id', bookingId)
      .single();

    if (fetchError || !booking) {
      throw new Error('Booking not found.');
    }

    if (
      booking.consumer_id !== userId &&
      booking.vendor_id !== userId
    ) {
      throw new Error('Not authorised to update this booking.');
    }

    const { data: updated, error } = await supabase
      .from('bookings')
      .update({
        status: data.status,
        updated_at: new Date().toISOString(),
      })
      .eq('id', bookingId)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return updated;
  }

  // --- Commission Config ---

  static async getCommissionConfig() {
    const { data, error } = await supabase
      .from('commission_config')
      .select('*')
      .order('category');

    if (error) throw new Error(error.message);
    return data ?? [];
  }

  static async updateCommission(
    adminId: string,
    data: UpdateCommissionInput
  ) {
    const { data: config, error } = await supabase
      .from('commission_config')
      .update({
        commission_percentage: data.commission_percentage,
        updated_by: adminId,
        updated_at: new Date().toISOString(),
      })
      .eq('category', data.category)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return config;
  }

  static async getVendorRevenue(vendorId: string) {
    const { data: bookings, error } = await supabase
      .from('bookings')
      .select(`
        *,
        service_listings (title, category),
        payments (status, paid_at, amount)
      `)
      .eq('vendor_id', vendorId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('getVendorRevenue error:', error);
      throw new Error(error.message);
    }

    const allBookings = bookings ?? [];

    const completedBookings = allBookings.filter(
      (b: any) => b.status === 'completed'
    );
    const confirmedBookings = allBookings.filter(
      (b: any) => b.status === 'confirmed'
    );

    const totalEarned = completedBookings.reduce(
      (sum: number, b: any) => sum + Number(b.vendor_amount), 0
    );
    const totalCommission = completedBookings.reduce(
      (sum: number, b: any) => sum + Number(b.commission_amount), 0
    );
    const pendingPayout = confirmedBookings.reduce(
      (sum: number, b: any) => sum + Number(b.vendor_amount), 0
    );

    return {
      total_earned: totalEarned,
      total_commission: totalCommission,
      pending_payout: pendingPayout,
      completed_bookings: completedBookings.length,
      bookings: allBookings,
    };
  }
}