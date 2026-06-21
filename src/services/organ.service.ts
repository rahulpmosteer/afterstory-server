// src/services/organ.service.ts

import { supabase } from '../lib/supabase.js';
import type { UpsertOrganDonationInput } from '../validators/organ.validator.js';

export class OrganService {

  static async getOrganDonationPledge(consumerId: string) {
    const { data, error } = await supabase
      .from('organ_donation_pledges')
      .select('*')
      .eq('consumer_id', consumerId)
      .single();

    // No pledge yet — return null, not an error
    if (error?.code === 'PGRST116') return null;
    if (error) throw new Error(error.message);
    return data;
  }

  static async upsertOrganDonationPledge(
    consumerId: string,
    data: UpsertOrganDonationInput
  ) {
    const { data: pledge, error } = await supabase
      .from('organ_donation_pledges')
      .upsert({
        consumer_id: consumerId,
        ...data,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'consumer_id',
      })
      .select()
      .single();

    if (error) throw new Error(error.message);
    return pledge;
  }

  static async deleteOrganDonationPledge(consumerId: string) {
    const { error } = await supabase
      .from('organ_donation_pledges')
      .delete()
      .eq('consumer_id', consumerId);

    if (error) throw new Error(error.message);
    return { message: 'Organ donation pledge deleted successfully.' };
  }
}