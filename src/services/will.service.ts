// src/services/will.service.ts

import { supabase } from '../lib/supabase.js';
import type {
  CreateWillInput,
  UpdateWillInput,
  CreateAssetInput,
  UpdateAssetInput,
  CreateBeneficiaryInput,
  UpdateBeneficiaryInput,
  SaveDistributionInput,
} from '../validators/will.validator.js';

export class WillService {

  // --- Will Core ---

  static async getWill(consumerId: string) {
    const [willResult, profileResult] = await Promise.all([
      supabase
        .from('wills')
        .select('*')
        .eq('consumer_id', consumerId)
        .single(),
      supabase
        .from('profiles')
        .select('*')
        .eq('id', consumerId)
        .single(),
    ]);

    const will = willResult.data ?? null;

    if (!will) {
      return {
        will: null,
        assets: [],
        beneficiaries: [],
        distribution: null,
        distribution_items: [],
        profile: profileResult.data,
      };
    }

    const [
      assetsResult,
      beneficiariesResult,
      distributionResult,
    ] = await Promise.all([
      supabase
        .from('will_assets')
        .select('*')
        .eq('will_id', will.id)
        .order('created_at', { ascending: true }),
      supabase
        .from('will_beneficiaries')
        .select('*')
        .eq('will_id', will.id)
        .order('created_at', { ascending: true }),
      supabase
        .from('will_distributions')
        .select('*')
        .eq('will_id', will.id)
        .single(),
    ]);

    let distributionItems: any[] = [];
    if (distributionResult.data) {
      const { data: items } = await supabase
        .from('will_distribution_items')
        .select('*')
        .eq('distribution_id', distributionResult.data.id)
        .order('created_at', { ascending: true });
      distributionItems = items ?? [];
    }

    return {
      will,
      assets: assetsResult.data ?? [],
      beneficiaries: beneficiariesResult.data ?? [],
      distribution: distributionResult.data ?? null,
      distribution_items: distributionItems,
      profile: profileResult.data,
    };
  }

  static async upsertWill(
    consumerId: string,
    data: CreateWillInput | UpdateWillInput
  ) {
    const { data: will, error } = await supabase
      .from('wills')
      .upsert({
        consumer_id: consumerId,
        ...data,
        status: 'draft',
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'consumer_id',
      })
      .select()
      .single();

    if (error) throw new Error(error.message);
    return will;
  }

  // --- Assets ---

  static async createAsset(consumerId: string, data: CreateAssetInput) {
    const { data: will, error: willError } = await supabase
      .from('wills')
      .select('id')
      .eq('consumer_id', consumerId)
      .single();

    if (willError || !will) {
      throw new Error('Please create your will first before adding assets.');
    }

    const { data: asset, error } = await supabase
      .from('will_assets')
      .insert({
        will_id: will.id,
        consumer_id: consumerId,
        ...data,
      })
      .select()
      .single();

    if (error) throw new Error(error.message);
    return asset;
  }

  static async updateAsset(
    consumerId: string,
    assetId: string,
    data: UpdateAssetInput
  ) {
    const { data: asset, error } = await supabase
      .from('will_assets')
      .update(data)
      .eq('id', assetId)
      .eq('consumer_id', consumerId)
      .select()
      .single();

    if (error) throw new Error(error.message);
    if (!asset) throw new Error('Asset not found.');
    return asset;
  }

  static async deleteAsset(consumerId: string, assetId: string) {
    const { error } = await supabase
      .from('will_assets')
      .delete()
      .eq('id', assetId)
      .eq('consumer_id', consumerId);

    if (error) throw new Error(error.message);
    return { message: 'Asset removed successfully.' };
  }

  // --- Beneficiaries ---

  static async createBeneficiary(
    consumerId: string,
    data: CreateBeneficiaryInput
  ) {
    const { data: will, error: willError } = await supabase
      .from('wills')
      .select('id')
      .eq('consumer_id', consumerId)
      .single();

    if (willError || !will) {
      throw new Error('Please create your will first before adding beneficiaries.');
    }

    const { data: beneficiary, error } = await supabase
      .from('will_beneficiaries')
      .insert({
        will_id: will.id,
        consumer_id: consumerId,
        ...data,
      })
      .select()
      .single();

    if (error) throw new Error(error.message);
    return beneficiary;
  }

  static async updateBeneficiary(
    consumerId: string,
    beneficiaryId: string,
    data: UpdateBeneficiaryInput
  ) {
    const { data: beneficiary, error } = await supabase
      .from('will_beneficiaries')
      .update(data)
      .eq('id', beneficiaryId)
      .eq('consumer_id', consumerId)
      .select()
      .single();

    if (error) throw new Error(error.message);
    if (!beneficiary) throw new Error('Beneficiary not found.');
    return beneficiary;
  }

  static async deleteBeneficiary(
    consumerId: string,
    beneficiaryId: string
  ) {
    const { error } = await supabase
      .from('will_beneficiaries')
      .delete()
      .eq('id', beneficiaryId)
      .eq('consumer_id', consumerId);

    if (error) throw new Error(error.message);
    return { message: 'Beneficiary removed successfully.' };
  }

  // --- Distribution ---

  static async saveDistribution(
    consumerId: string,
    data: SaveDistributionInput
  ) {
    const { data: will, error: willError } = await supabase
      .from('wills')
      .select('id')
      .eq('consumer_id', consumerId)
      .single();

    if (willError || !will) {
      throw new Error('Will not found.');
    }

    if (data.mode === 'simple') {
      const total = data.items.reduce(
        (sum, item) => sum + item.share_percentage, 0
      );
      if (Math.abs(total - 100) > 0.01) {
        throw new Error(
          `Share percentages must total 100%. Current total: ${total}%`
        );
      }
    } else {
      const assetGroups = new Map<string, number>();
      for (const item of data.items) {
        const key = item.asset_id ?? 'null';
        assetGroups.set(
          key,
          (assetGroups.get(key) ?? 0) + item.share_percentage
        );
      }
      for (const [assetId, total] of assetGroups) {
        if (Math.abs(total - 100) > 0.01) {
          throw new Error(
            `Shares for asset must total 100%. Asset ${assetId} totals ${total}%.`
          );
        }
      }
    }

    const { data: distribution, error: distError } = await supabase
      .from('will_distributions')
      .upsert({
        will_id: will.id,
        consumer_id: consumerId,
        distribution_mode: data.mode,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'will_id',
      })
      .select()
      .single();

    if (distError) throw new Error(distError.message);

    await supabase
      .from('will_distribution_items')
      .delete()
      .eq('distribution_id', distribution.id);

    if (data.items.length > 0) {
      const { error: itemsError } = await supabase
        .from('will_distribution_items')
        .insert(
          data.items.map(item => ({
            distribution_id: distribution.id,
            will_id: will.id,
            consumer_id: consumerId,
            asset_id: item.asset_id ?? null,
            beneficiary_id: item.beneficiary_id,
            share_percentage: item.share_percentage,
          }))
        );

      if (itemsError) throw new Error(itemsError.message);
    }

    return { message: 'Distribution saved successfully.' };
  }

  static async getDistribution(consumerId: string) {
    const { data: will } = await supabase
      .from('wills')
      .select('id')
      .eq('consumer_id', consumerId)
      .single();

    if (!will) return { distribution: null, items: [] };

    const { data: distribution } = await supabase
      .from('will_distributions')
      .select('*')
      .eq('will_id', will.id)
      .single();

    if (!distribution) return { distribution: null, items: [] };

    const { data: items } = await supabase
      .from('will_distribution_items')
      .select('*')
      .eq('distribution_id', distribution.id)
      .order('created_at', { ascending: true });

    return { distribution, items: items ?? [] };
  }

  // --- Mark will as generated ---

  static async markAsGenerated(consumerId: string) {
    const { error } = await supabase
      .from('wills')
      .update({
        status: 'generated',
        generated_at: new Date().toISOString(),
      })
      .eq('consumer_id', consumerId);

    if (error) throw new Error(error.message);
    return { message: 'Will marked as generated.' };
  }
}