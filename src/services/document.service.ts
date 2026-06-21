// src/services/document.service.ts

import { supabase } from '../lib/supabase.js';
import type {
  CreateDocumentInput,
  UpdateDocumentInput,
} from '../validators/document.validator.js';

export class DocumentService {

  static async getDocuments(consumerId: string) {
    const { data, error } = await supabase
      .from('documents')
      .select('*')
      .eq('consumer_id', consumerId)
      .order('created_at', { ascending: false });

    if (error) throw new Error(error.message);
    return data ?? [];
  }

  static async getDocument(consumerId: string, documentId: string) {
    const { data, error } = await supabase
      .from('documents')
      .select('*')
      .eq('id', documentId)
      .eq('consumer_id', consumerId)
      .single();

    if (error) throw new Error(error.message);
    if (!data) throw new Error('Document not found.');
    return data;
  }

  static async uploadDocument(
    consumerId: string,
    file: Buffer,
    fileName: string,
    mimeType: string,
    fileSize: number,
    data: CreateDocumentInput
  ) {
    // 1. Upload file to Supabase Storage
    const timestamp = Date.now();
    const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
    const storagePath = `${consumerId}/${timestamp}_${sanitizedFileName}`;

    const { error: uploadError } = await supabase.storage
      .from('vault-documents')
      .upload(storagePath, file, {
        contentType: mimeType,
        upsert: false,
      });

    if (uploadError) throw new Error(uploadError.message);

    // 2. Get signed URL valid for 1 year
    const { data: signedUrl } = await supabase.storage
      .from('vault-documents')
      .createSignedUrl(storagePath, 60 * 60 * 24 * 365);

    if (!signedUrl) throw new Error('Failed to generate file URL.');

    // 3. Save document metadata to database
    const { data: document, error: dbError } = await supabase
      .from('documents')
      .insert({
        consumer_id: consumerId,
        title: data.title,
        category: data.category,
        file_url: signedUrl.signedUrl,
        file_name: fileName,
        file_size_bytes: fileSize,
        mime_type: mimeType,
        expiry_date: data.expiry_date ?? null,
        notes: data.notes ?? null,
        nominee_access: data.nominee_access ?? [],
        metadata: data.metadata ?? {},
      })
      .select()
      .single();

    if (dbError) {
      // Clean up uploaded file if DB insert fails
      await supabase.storage
        .from('vault-documents')
        .remove([storagePath]);
      throw new Error(dbError.message);
    }

    return document;
  }

  static async updateDocument(
    consumerId: string,
    documentId: string,
    data: UpdateDocumentInput
  ) {
    const { data: document, error } = await supabase
      .from('documents')
      .update({
        ...data,
        updated_at: new Date().toISOString(),
      })
      .eq('id', documentId)
      .eq('consumer_id', consumerId)
      .select()
      .single();

    if (error) throw new Error(error.message);
    if (!document) throw new Error('Document not found.');
    return document;
  }

  static async deleteDocument(
    consumerId: string,
    documentId: string
  ) {
    // 1. Get document to find storage path
    const { data: document, error: fetchError } = await supabase
      .from('documents')
      .select('file_url, file_name')
      .eq('id', documentId)
      .eq('consumer_id', consumerId)
      .single();

    if (fetchError || !document) {
      throw new Error('Document not found.');
    }

    // 2. Delete from database first
    const { error: deleteError } = await supabase
      .from('documents')
      .delete()
      .eq('id', documentId)
      .eq('consumer_id', consumerId);

    if (deleteError) throw new Error(deleteError.message);

    // 3. Extract storage path from signed URL and delete from storage
    // Signed URLs contain the path after /object/sign/bucket-name/
    try {
      const url = new URL(document.file_url);
      const pathParts = url.pathname.split('/vault-documents/');
      if (pathParts.length > 1) {
        const storagePath = pathParts[1]!.split('?')[0];
        await supabase.storage
          .from('vault-documents')
          .remove([decodeURIComponent(storagePath ?? '')]);
      }
    } catch {
      // Storage cleanup failed but DB record is deleted
      // Log this but don't throw — user experience is correct
      console.warn('Storage cleanup failed for document:', documentId);
    }

    return { message: 'Document deleted successfully.' };
  }

  static async refreshDocumentUrl(
    consumerId: string,
    documentId: string
  ) {
    // Signed URLs expire after 1 year
    // This endpoint refreshes the URL when needed
    const { data: document, error } = await supabase
      .from('documents')
      .select('file_url, file_name')
      .eq('id', documentId)
      .eq('consumer_id', consumerId)
      .single();

    if (error || !document) throw new Error('Document not found.');

    try {
      const url = new URL(document.file_url);
      const pathParts = url.pathname.split('/vault-documents/');
      if (pathParts.length < 2) throw new Error('Invalid file URL.');

      const storagePath = pathParts[1]!.split('?')[0];

      const { data: signedUrl } = await supabase.storage
        .from('vault-documents')
        .createSignedUrl(
          decodeURIComponent(storagePath ?? ''),
          60 * 60 * 24 * 365
        );

      if (!signedUrl) throw new Error('Failed to refresh URL.');

      // Update URL in database
      await supabase
        .from('documents')
        .update({
          file_url: signedUrl.signedUrl,
          updated_at: new Date().toISOString(),
        })
        .eq('id', documentId)
        .eq('consumer_id', consumerId);

      return { file_url: signedUrl.signedUrl };
    } catch {
      throw new Error('Failed to refresh document URL.');
    }
  }

  static async getDocumentsByCategory(consumerId: string) {
    const { data, error } = await supabase
      .from('documents')
      .select('*')
      .eq('consumer_id', consumerId)
      .order('category', { ascending: true })
      .order('created_at', { ascending: false });

    if (error) throw new Error(error.message);

    // Group by category
    const grouped: Record<string, any[]> = {};
    for (const doc of data ?? []) {
        grouped[doc.category] ??= [];
        grouped[doc.category]!.push(doc);
    }

    return grouped;
  }
}