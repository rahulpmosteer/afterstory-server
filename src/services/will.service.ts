// src/services/will.service.ts


import puppeteer from 'puppeteer';
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
import { generateWillHtml } from '../templates/will.template.js';

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

    // Fetch distribution items if distribution exists
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
      throw new Error(
        'Please create your will first before adding beneficiaries.'
      );
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
    // 1. Get will ID
    const { data: will, error: willError } = await supabase
      .from('wills')
      .select('id')
      .eq('consumer_id', consumerId)
      .single();

    if (willError || !will) {
      throw new Error('Will not found.');
    }

    // 2. Validate share percentages per asset
    // For simple mode — all items have null asset_id, must total 100%
    // For by_asset mode — items per asset must total 100%
    if (data.mode === 'simple') {
      const total = data.items.reduce(
        (sum, item) => sum + item.share_percentage,
        0
      );
      if (Math.abs(total - 100) > 0.01) {
        throw new Error(
          `Share percentages must total 100%. Current total: ${total}%`
        );
      }
    } else {
      // Group by asset_id and validate each group totals 100%
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
            `Shares for asset must total 100%. ` +
            `Asset ${assetId} totals ${total}%.`
          );
        }
      }
    }

    // 3. Upsert distribution record
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

    // 4. Delete existing items and re-insert
    // Simpler than trying to diff and patch
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

    return {
      distribution,
      items: items ?? [],
    };
  }

  // --- PDF Generation ---

  static async generatePdf(consumerId: string) {
    const willData = await WillService.getWill(consumerId);

    if (!willData.will) {
      throw new Error('Please complete your will before generating a PDF.');
    }

    if (willData.assets.length === 0) {
      throw new Error('Please add at least one asset before generating.');
    }

    if (willData.beneficiaries.length === 0) {
      throw new Error(
        'Please add at least one beneficiary before generating.'
      );
    }

    if (!willData.distribution) {
      throw new Error(
        'Please complete the distribution step before generating.'
      );
    }

    const { data: metadata } = await supabase
      .from('consumer_metadata')
      .select('*')
      .eq('profile_id', consumerId)
      .single();

    const html = generateWillHtml({
      profile: willData.profile,
      metadata,
      will: willData.will,
      assets: willData.assets,
      beneficiaries: willData.beneficiaries,
      distribution: willData.distribution,
      distribution_items: willData.distribution_items,
    });

    const browser = await puppeteer.launch({
      headless: true,
      executablePath: process.env.CHROME_PATH ??
        '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });

    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: {
        top: '20mm',
        bottom: '20mm',
        left: '15mm',
        right: '15mm',
      },
    });

    await browser.close();

    const fileName = `${consumerId}/will_${Date.now()}.pdf`;

    const { error: uploadError } = await supabase.storage
      .from('will-documents')
      .upload(fileName, pdfBuffer, {
        contentType: 'application/pdf',
        upsert: true,
      });

    if (uploadError) throw new Error(uploadError.message);

    const { data: signedUrl } = await supabase.storage
      .from('will-documents')
      .createSignedUrl(fileName, 60 * 60 * 24 * 365);

    if (!signedUrl) throw new Error('Failed to generate download link.');

    await supabase
      .from('wills')
      .update({
        pdf_url: signedUrl.signedUrl,
        generated_at: new Date().toISOString(),
        status: 'generated',
      })
      .eq('consumer_id', consumerId);

    return {
      pdf_url: signedUrl.signedUrl,
      message: 'Will document generated successfully.',
    };
  }
}

/*

import puppeteer from 'puppeteer';
import { supabase } from '../lib/supabase.js';
import type {
  CreateWillInput,
  UpdateWillInput,
  CreateAssetInput,
  UpdateAssetInput,
  CreateBeneficiaryInput,
  UpdateBeneficiaryInput,
} from '../validators/will.validator.js';
import { generateWillHtml } from '../templates/will.template.js';

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

    // Will may not exist yet — that's fine
    const will = willResult.data ?? null;

    if (!will) {
      return {
        will: null,
        assets: [],
        beneficiaries: [],
        profile: profileResult.data,
      };
    }

    // Fetch assets and beneficiaries in parallel
    const [assetsResult, beneficiariesResult] = await Promise.all([
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
    ]);

    return {
      will,
      assets: assetsResult.data ?? [],
      beneficiaries: beneficiariesResult.data ?? [],
      profile: profileResult.data,
    };
  }

  static async upsertWill(consumerId: string, data: CreateWillInput | UpdateWillInput) {
  const { data: will, error } = await supabase
    .from('wills')
    .upsert({
      consumer_id: consumerId,
      ...data,
      status: 'draft',
      updated_at: new Date().toISOString(),
    }, {
      onConflict: 'consumer_id', // tell Supabase to update on conflict
    })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return will;
}

  // --- Assets ---

  static async createAsset(
    consumerId: string,
    data: CreateAssetInput
  ) {
    // Get the will ID first
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

  // --- PDF Generation ---

  static async generatePdf(consumerId: string) {
    // 1. Fetch all will data
    const willData = await WillService.getWill(consumerId);

    if (!willData.will) {
      throw new Error('Please complete your will before generating a PDF.');
    }

    if (willData.assets.length === 0) {
      throw new Error('Please add at least one asset before generating.');
    }

    if (willData.beneficiaries.length === 0) {
      throw new Error('Please add at least one beneficiary before generating.');
    }

    // 2. Fetch consumer metadata for personal details
    const { data: metadata } = await supabase
      .from('consumer_metadata')
      .select('*')
      .eq('profile_id', consumerId)
      .single();

    // 3. Generate HTML from template
    const html = generateWillHtml({
      profile: willData.profile,
      metadata,
      will: willData.will,
      assets: willData.assets,
      beneficiaries: willData.beneficiaries,
    });

    // 4. Launch puppeteer and generate PDF
    // const browser = await puppeteer.launch({
    //   headless: true,
    //   args: ['--no-sandbox', '--disable-setuid-sandbox'],
    // });

    // const browser = await puppeteer.launch({
    //     headless: true,
    //     executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    //     args: ['--no-sandbox', '--disable-setuid-sandbox'],
    // });

    const browser = await puppeteer.launch({
        headless: true,
        executablePath: process.env.CHROME_PATH ?? 
            '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });

    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: {
        top: '20mm',
        bottom: '20mm',
        left: '15mm',
        right: '15mm',
      },
    });

    await browser.close();

    // 5. Upload PDF to Supabase Storage
    const fileName = `${consumerId}/will_${Date.now()}.pdf`;

    const { error: uploadError } = await supabase.storage
      .from('will-documents')
      .upload(fileName, pdfBuffer, {
        contentType: 'application/pdf',
        upsert: true,
      });

    if (uploadError) throw new Error(uploadError.message);

    // 6. Get signed URL (valid for 1 year)
    // Will PDFs are private — we use signed URLs not public URLs
    const { data: signedUrl } = await supabase.storage
      .from('will-documents')
      .createSignedUrl(fileName, 60 * 60 * 24 * 365);

    if (!signedUrl) throw new Error('Failed to generate download link.');

    // 7. Save PDF URL and mark as generated
    await supabase
      .from('wills')
      .update({
        pdf_url: signedUrl.signedUrl,
        generated_at: new Date().toISOString(),
        status: 'generated',
      })
      .eq('consumer_id', consumerId);

    return {
      pdf_url: signedUrl.signedUrl,
      message: 'Will document generated successfully.',
    };
  }
}

*/