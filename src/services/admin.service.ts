// src/services/admin.service.ts

// src/services/admin.service.ts

import { supabase } from '../lib/supabase.js';

export class AdminService {

  /**
   * Fetches the basic metric counts for the dashboard cards.
   */
  static async getStats() {
    const [
      usersResult,
      vendorsResult,
      pendingServicesResult,
      familyResult,
    ] = await Promise.all([
      supabase.from('profiles').select('id', { count: 'exact' }),
      supabase
        .from('profiles')
        .select('id', { count: 'exact' })
        .eq('role', 'vendor'),
      supabase
        .from('vendor_services')
        .select('id', { count: 'exact' })
        .eq('status', 'pending'),
      supabase
        .from('profiles')
        .select('id', { count: 'exact' })
        .eq('role', 'family'),
    ]);

    return {
      total_users: usersResult.count ?? 0,
      total_vendors: vendorsResult.count ?? 0,
      total_family: familyResult.count ?? 0,
      pending_approvals: pendingServicesResult.count ?? 0,
    };
  }

  /**
   * Fetches all pending services, routing through profiles to pick up metadata.
   * Cleans and flattens the response structure to perfectly match PendingServiceModel.
   */
  static async getPendingServices() {
    // Step 1 — get pending services with basic profile info only
    const { data, error } = await supabase
      .from('vendor_services')
      .select(`
        *,
        profiles!vendor_services_vendor_id_fkey (
          id,
          full_name,
          phone_number,
          role
        )
      `)
      .eq('status', 'pending')
      .order('created_at', { ascending: true });
 
    if (error) throw new Error(error.message);
    if (!data || data.length === 0) return [];
 
    // Step 2 — fetch vendor metadata separately
    const vendorIds = [...new Set(data.map((s: any) => s.vendor_id))];
    const { data: metadataList } = await supabase
      .from('vendor_metadata')
      .select('profile_id, business_name, aadhaar_number, pan_number, status')
      .in('profile_id', vendorIds);
 
    const metadataMap = new Map(
      (metadataList ?? []).map((m: any) => [m.profile_id, m])
    );
 
    return data.map((service: any) => ({
      ...service,
      profiles: service.profiles ?? null,
      vendor_metadata: metadataMap.get(service.vendor_id) ?? null,
    }));
  }
 

  /**
   * Fetches all vendor profiles along with their specialized metadata and catalog services.
   * Resolves relationship ambiguities using exact explicit constraint qualifiers.
   */
   static async getAllVendors() {
    // Step 1 — get vendor profiles with their services
    const { data, error } = await supabase
      .from('profiles')
      .select(`
        *,
        vendor_services!vendor_services_vendor_id_fkey (
          id,
          category,
          status
        )
      `)
      .eq('role', 'vendor')
      .order('created_at', { ascending: false });
 
    if (error) throw new Error(error.message);
    if (!data || data.length === 0) return [];
 
    // Step 2 — fetch vendor metadata separately
    const vendorIds = data.map((v: any) => v.id);
    const { data: metadataList } = await supabase
      .from('vendor_metadata')
      .select('profile_id, business_name, status, pan_number, aadhaar_number')
      .in('profile_id', vendorIds);
 
    const metadataMap = new Map(
      (metadataList ?? []).map((m: any) => [m.profile_id, m])
    );
 
    return data.map((vendor: any) => ({
      ...vendor,
      vendor_metadata: metadataMap.get(vendor.id) ?? null,
      vendor_services: vendor.vendor_services ?? [],
    }));
  }

  static async getAllVendorServices() {
    // Step 1 — get all services with basic profile info
    const { data, error } = await supabase
      .from('vendor_services')
      .select(`
        *,
        profiles!vendor_services_vendor_id_fkey (
          id,
          full_name,
          phone_number,
          role
        )
      `)
      .order('created_at', { ascending: false });
 
    if (error) throw new Error(error.message);
    if (!data || data.length === 0) return [];
 
    // Step 2 — fetch vendor metadata separately
    const vendorIds = [...new Set(data.map((s: any) => s.vendor_id))];
    const { data: metadataList } = await supabase
      .from('vendor_metadata')
      .select('profile_id, business_name, aadhaar_number, pan_number, status')
      .in('profile_id', vendorIds);
 
    const metadataMap = new Map(
      (metadataList ?? []).map((m: any) => [m.profile_id, m])
    );
 
    return data.map((service: any) => ({
      ...service,
      profiles: service.profiles ?? null,
      vendor_metadata: metadataMap.get(service.vendor_id) ?? null,
    }));
  }
 

  /**
   * Fetches all registered system profiles.
   */
  static async getAllUsers() {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw new Error(error.message);
    return data ?? [];
  }

  /**
   * Approves or rejects a specific service catalog entry submitted by a vendor.
   */
  static async reviewVendorService(
    adminId: string,
    serviceId: string,
    status: 'approved' | 'rejected',
    rejectionReason?: string
  ) {
    const { data, error } = await supabase
      .from('vendor_services')
      .update({
        status,
        rejection_reason: rejectionReason ?? null,
        reviewed_by: adminId,
        reviewed_at: new Date().toISOString(),
      })
      .eq('id', serviceId)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data;
  }
}


/*
import { supabase } from '../lib/supabase.js';

export class AdminService {

  static async getStats() {
    const [
      usersResult,
      vendorsResult,
      pendingServicesResult,
      familyResult,
    ] = await Promise.all([
      supabase.from('profiles').select('id', { count: 'exact' }),
      supabase
        .from('profiles')
        .select('id', { count: 'exact' })
        .eq('role', 'vendor'),
      supabase
        .from('vendor_services')
        .select('id', { count: 'exact' })
        .eq('status', 'pending'),
      supabase
        .from('profiles')
        .select('id', { count: 'exact' })
        .eq('role', 'family'),
    ]);

    return {
      total_users: usersResult.count ?? 0,
      total_vendors: vendorsResult.count ?? 0,
      total_family: familyResult.count ?? 0,
      pending_approvals: pendingServicesResult.count ?? 0,
    };
  }

  static async getPendingServices() {
    const { data, error } = await supabase
      .from('vendor_services')
      .select(`
        *,
        profiles!vendor_services_vendor_id_fkey (
          id,
          full_name,
          phone_number,
          role
        ),
        vendor_metadata!vendor_services_vendor_id_fkey (
          business_name,
          aadhaar_number,
          pan_number,
          status
        )
      `)
      .eq('status', 'pending')
      .order('created_at', { ascending: true });

    if (error) throw new Error(error.message);
    return data ?? [];
  }

  static async getAllVendors() {
    const { data, error } = await supabase
      .from('profiles')
      .select(`
        *,
        vendor_metadata!profile_id (
          business_name,
          status,
          pan_number,
          aadhaar_number
        ),
        vendor_services (
          id,
          category,
          status
        )
      `)
      .eq('role', 'vendor')
      .order('created_at', { ascending: false });

    if (error) throw new Error(error.message);
    return data ?? [];
  }

  static async getAllUsers() {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw new Error(error.message);
    return data ?? [];
  }

  static async reviewVendorService(
    adminId: string,
    serviceId: string,
    status: 'approved' | 'rejected',
    rejectionReason?: string
  ) {
    const { data, error } = await supabase
      .from('vendor_services')
      .update({
        status,
        rejection_reason: rejectionReason ?? null,
        reviewed_by: adminId,
        reviewed_at: new Date().toISOString(),
      })
      .eq('id', serviceId)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data;
  }
}
  */