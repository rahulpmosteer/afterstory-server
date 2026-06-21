// src/services/profile.service.ts


import { supabase } from '../lib/supabase.js';
import type {
  VendorOnboardingInput,
  ConsumerOnboardingInput,
  UpdateProfileInput,
  UpdateConsumerMetadataInput,
  CreateNomineeInput,
  UpdateNomineeInput,
  VendorServiceInput,
  ReviewVendorServiceInput,
} from '../validators/profile.validator.js';

export class ProfileService {

  // --- Existing Methods ---

  static async updateVendorMetadata(userId: string, data: VendorOnboardingInput) {
    const { error } = await supabase
      .from('vendor_metadata')
      .upsert({
        profile_id: userId,
        ...data,
        status: 'pending'
      });

    if (error) throw new Error(error.message);
    return { message: "Vendor profile updated and sent for verification." };
  }

  static async updateConsumerMetadata(userId: string, data: ConsumerOnboardingInput) {
    const { error } = await supabase
      .from('consumer_metadata')
      .upsert({
        profile_id: userId,
        ...data
      });

    if (error) throw new Error(error.message);
    return { message: "Consumer profile updated successfully." };
  }

  // --- New Methods ---

  static async getProfile(userId: string) {
    const [profileResult, metadataResult, nomineesResult, willResult, documentsResult, funeralResult, organDonationResult] =
      await Promise.all([
        supabase.from('profiles').select('*').eq('id', userId).single(),
        supabase.from('consumer_metadata').select('*').eq('profile_id', userId).single(),
        supabase.from('nominees').select('*').eq('consumer_id', userId).order('created_at', { ascending: true }),
        supabase.from('wills').select('status').eq('consumer_id', userId).single(),
        supabase.from('documents').select('id').eq('consumer_id', userId),
        supabase.from('funeral_preferences').select('rite_type').eq('consumer_id', userId).single(),
        supabase.from('organ_donation_pledges').select('id').eq('consumer_id', userId).single(),
      ]);


    if (profileResult.error) throw new Error(profileResult.error.message);

    const profile = profileResult.data;
    const metadata = metadataResult.data ?? null;
    const nominees = nomineesResult.data ?? [];
    const will = willResult.data ?? null;
    const documentsCount = documentsResult.data?.length ?? 0;
    const funeralPrefs = funeralResult.data ?? null;
    const organDonationPledges = organDonationResult.data ?? null;
    const score = ProfileService.calculateCompletionScore(
      metadata,
      nominees,
      will,
      documentsCount,
      funeralPrefs,
      organDonationPledges,
    );

    return { profile, metadata, nominees, completion_score: score };
  }

  static async updateProfile(userId: string, data: UpdateProfileInput) {
    const { error } = await supabase
      .from('profiles')
      .update(data)
      .eq('id', userId);

    if (error) throw new Error(error.message);
    return { message: "Profile updated successfully." };
  }

  static async updatePersonalMetadata(
    userId: string,
    data: UpdateConsumerMetadataInput
  ) {
    const { error } = await supabase
      .from('consumer_metadata')
      .upsert({
        profile_id: userId,
        ...data
      });

    if (error) throw new Error(error.message);
    return { message: "Personal details updated successfully." };
  }

  static async uploadProfilePhoto(userId: string, file: Buffer, mimeType: string) {
    const fileName = `${userId}/photo.${mimeType.split('/')[1]}`;

    const { error: uploadError } = await supabase.storage
      .from('profile-photos')
      .upload(fileName, file, {
        contentType: mimeType,
        upsert: true, // overwrite if exists
      });

    if (uploadError) throw new Error(uploadError.message);

    // Get the public URL
    const { data } = supabase.storage
      .from('profile-photos')
      .getPublicUrl(fileName);

    // Save the URL to consumer_metadata
    const { error: updateError } = await supabase
      .from('consumer_metadata')
      .upsert({
        profile_id: userId,
        profile_photo_url: data.publicUrl,
      });

    if (updateError) throw new Error(updateError.message);

    return { photo_url: data.publicUrl };
  }

  // --- Nominee Methods ---

  static async getNominees(userId: string) {
    const { data, error } = await supabase
      .from('nominees')
      .select('*')
      .eq('consumer_id', userId)
      .order('created_at', { ascending: true });

    if (error) throw new Error(error.message);
    return data ?? [];
  }

  static async createNominee(userId: string, data: CreateNomineeInput) {
    // If this nominee is being set as primary,
    // remove primary status from all other nominees first
    if (data.is_primary) {
      await supabase
        .from('nominees')
        .update({ is_primary: false })
        .eq('consumer_id', userId);
    }

    const { data: nominee, error } = await supabase
      .from('nominees')
      .insert({
        consumer_id: userId,
        ...data,
      })
      .select()
      .single();

    if (error) {
      // Supabase unique constraint violation code
      if (error.code === '23505') {
        throw new Error(
          'A nominee with this Aadhaar number already exists.'
        );
      }
      throw new Error(error.message);
    }

    return nominee;
  }

  static async updateNominee(
    userId: string,
    nomineeId: string,
    data: UpdateNomineeInput
  ) {
    // If setting as primary, remove primary from others first
    if (data.is_primary) {
      await supabase
        .from('nominees')
        .update({ is_primary: false })
        .eq('consumer_id', userId);
    }

    const { data: nominee, error } = await supabase
      .from('nominees')
      .update(data)
      .eq('id', nomineeId)
      .eq('consumer_id', userId) // ensures user owns this nominee
      .select()
      .single();

    if (error) throw new Error(error.message);
    if (!nominee) throw new Error('Nominee not found.');

    return nominee;
  }

  static async deleteNominee(userId: string, nomineeId: string) {
    const { error } = await supabase
      .from('nominees')
      .delete()
      .eq('id', nomineeId)
      .eq('consumer_id', userId); // ensures user owns this nominee

    if (error) throw new Error(error.message);
    return { message: "Nominee removed successfully." };
  }

  // --- Private Helper ---

  private static calculateCompletionScore(
  metadata: any,
  nominees: any[],
  will: any,
  documentsCount: number,
  funeralPrefs: any,
  organPledge: any
): number {
  let score = 0;

  // Personal details — 20%
  if (metadata?.date_of_birth && metadata?.gender && metadata?.state) {
    score += 20;
  }

  // Nominee added — 20%
  if (nominees.length > 0) score += 20;

  // Will generated — 20%
  if (will?.status === 'generated') score += 20;

  // Document uploaded — 10%
  if (documentsCount > 0) score += 10;

  // Funeral preferences — 20%
  if (funeralPrefs?.rite_type) score += 20;

  if (organPledge) score += 10;

  return score;
}

  static async getVendorServices(vendorId: string) {
  const { data, error } = await supabase
    .from('vendor_services')
    .select('*')
    .eq('vendor_id', vendorId)
    .order('created_at', { ascending: true });

  if (error) throw new Error(error.message);
  return data ?? [];
}

static async addVendorService(vendorId: string, data: VendorServiceInput) {
  const { data: service, error } = await supabase
    .from('vendor_services')
    .insert({
      vendor_id: vendorId,
      category: data.category,
      status: 'pending',
      metadata: data.metadata ?? {},
    })
    .select()
    .single();

  if (error) {
    if (error.code === '23505') {
      throw new Error('You have already registered for this service category.');
    }
    throw new Error(error.message);
  }

  return service;
}

static async removeVendorService(vendorId: string, serviceId: string) {
  // Vendors can only remove pending or rejected services
  // Approved services cannot be self-removed — admin must handle
  const { data: existing, error: fetchError } = await supabase
    .from('vendor_services')
    .select('status')
    .eq('id', serviceId)
    .eq('vendor_id', vendorId)
    .single();

  if (fetchError || !existing) throw new Error('Service not found.');

  if (existing.status === 'approved') {
    throw new Error(
      'Approved services cannot be removed. Please contact AfterStory support.'
    );
  }

  const { error } = await supabase
    .from('vendor_services')
    .delete()
    .eq('id', serviceId)
    .eq('vendor_id', vendorId);

  if (error) throw new Error(error.message);
  return { message: 'Service removed successfully.' };
}

static async reviewVendorService(
  adminId: string,
  serviceId: string,
  data: ReviewVendorServiceInput
) {
  const { data: service, error } = await supabase
    .from('vendor_services')
    .update({
      status: data.status,
      rejection_reason: data.rejection_reason ?? null,
      reviewed_by: adminId,
      reviewed_at: new Date().toISOString(),
    })
    .eq('id', serviceId)
    .select()
    .single();

  if (error) throw new Error(error.message);
  if (!service) throw new Error('Service not found.');

  return service;
}

static async getVendorProfile(vendorId: string) {
  const [profileResult, metadataResult, servicesResult] = await Promise.all([
    supabase
      .from('profiles')
      .select('*')
      .eq('id', vendorId)
      .single(),
    supabase
      .from('vendor_metadata')
      .select('*')
      .eq('profile_id', vendorId)
      .single(),
    supabase
      .from('vendor_services')
      .select('*')
      .eq('vendor_id', vendorId)
      .order('created_at', { ascending: true }),
  ]);

  if (profileResult.error) throw new Error(profileResult.error.message);

  return {
    profile: profileResult.data,
    metadata: metadataResult.data ?? null,
    services: servicesResult.data ?? [],
  };
}
}