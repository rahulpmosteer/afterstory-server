// src/services/vendor.service.ts

import { supabase } from '../lib/supabase.js';
import type { UpsertVendorMetadataInput } from '../validators/vendor.validator.js';

export class VendorService {

  static async getVendorProfile(vendorId: string) {
    const [profileResult, metadataResult, servicesResult] =
      await Promise.all([
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

  static async upsertVendorMetadata(
    vendorId: string,
    data: UpsertVendorMetadataInput
  ) {
    const updateData: any = {
      profile_id: vendorId,
      ...data,
    };

    

    // Convert lat/lng to PostGIS point if provided
    if (data.latitude !== undefined && data.longitude !== undefined) {
      updateData.base_location = `POINT(${data.longitude} ${data.latitude})`;
      delete updateData.latitude;
      delete updateData.longitude;
    }

    console.log('Upserting vendor metadata:', JSON.stringify(updateData, null, 2));

    const { data: metadata, error } = await supabase
      .from('vendor_metadata')
      .upsert(updateData, {
        onConflict: 'profile_id',
      })
      .select()
      .single();

    if (error) {
      console.error('Vendor metadata upsert error:', error);
      throw new Error(error.message);
    }
    return metadata;
  }

  static async getOnboardingStatus(vendorId: string) {
    const { data: metadata, error } = await supabase
      .from('vendor_metadata')
      .select('*')
      .eq('profile_id', vendorId)
      .single();

    if (error?.code === 'PGRST116') {
      return {
        is_complete: false,
        missing_fields: [
          'business_name',
          'aadhaar_number',
          'pan_number',
          'base_location',
          'bank_account_number',
          'bank_ifsc',
        ],
        completion_percentage: 0,
      };
    }

    if (error) throw new Error(error.message);

    // Calculate which fields are complete
    const checks = [
      { field: 'business_name', value: metadata?.business_name },
      { field: 'aadhaar_number', value: metadata?.aadhaar_number },
      { field: 'pan_number', value: metadata?.pan_number },
      { field: 'base_location', value: metadata?.base_location },
      { field: 'bank_account_number', value: metadata?.bank_account_number },
      { field: 'bank_ifsc', value: metadata?.bank_ifsc },
      { field: 'business_address', value: metadata?.business_address },
      { field: 'working_hours', value: metadata?.working_hours },
    ];

    const completed = checks.filter(c => c.value != null);
    const missing = checks
      .filter(c => c.value == null)
      .map(c => c.field);

    const percentage = Math.round(
      (completed.length / checks.length) * 100
    );

    return {
      is_complete: missing.length === 0,
      missing_fields: missing,
      completion_percentage: percentage,
      metadata,
    };
  }
}