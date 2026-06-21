// src/services/funeral.service.ts

import { supabase } from '../lib/supabase.js';
import type { UpsertFuneralPreferencesInput } from '../validators/funeral.validator.js';

export class FuneralService {

  static async getFuneralPreferences(consumerId: string) {
    const { data, error } = await supabase
      .from('funeral_preferences')
      .select('*')
      .eq('consumer_id', consumerId)
      .single();

    // No preferences yet — return null, not an error
    if (error?.code === 'PGRST116') return null;
    if (error) throw new Error(error.message);
    return data;
  }

  static async upsertFuneralPreferences(
    consumerId: string,
    data: UpsertFuneralPreferencesInput
  ) {
    const { data: preferences, error } = await supabase
      .from('funeral_preferences')
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
    return preferences;
  }

  static async deleteFuneralPreferences(consumerId: string) {
    const { error } = await supabase
      .from('funeral_preferences')
      .delete()
      .eq('consumer_id', consumerId);

    if (error) throw new Error(error.message);
    return { message: 'Funeral preferences deleted successfully.' };
  }
}