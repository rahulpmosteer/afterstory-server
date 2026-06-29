// src/api/documents/document.controller.ts

import 'multer';
import type { Request, Response } from 'express';
import { DocumentService } from '../../services/document.service.js';
import {
  createDocumentSchema,
  updateDocumentSchema,
} from '../../validators/document.validator.js';
import { ZodError } from 'zod';

export class DocumentController {

  static async getDocuments(req: Request, res: Response) {
    try {
      const consumerId = req.user!.id;
      const grouped = req.query['grouped'] === 'true';

      const result = grouped
        ? await DocumentService.getDocumentsByCategory(consumerId)
        : await DocumentService.getDocuments(consumerId);

      return res.status(200).json({
        success: true,
        data: result,
      });

    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }

  static async getDocument(req: Request, res: Response) {
    try {
      const consumerId = req.user!.id;
      const documentId = Array.isArray(req.params['id'])
        ? req.params['id'][0]
        : req.params['id'];

      if (!documentId) {
        return res.status(400).json({
          success: false,
          message: 'Document ID is required.',
        });
      }

      const document = await DocumentService.getDocument(
        consumerId,
        documentId
      );

      return res.status(200).json({
        success: true,
        data: document,
      });

    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }

  static async uploadDocument(
    req: Request & { file?: any },
    res: Response
    ) {
    try {
      const consumerId = req.user!.id;

      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: 'No file provided.',
        });
      }

      const validatedData = createDocumentSchema.parse({
        ...req.body,
        nominee_access: req.body.nominee_access
          ? JSON.parse(req.body.nominee_access)
          : [],
      });

      const document = await DocumentService.uploadDocument(
        consumerId,
        req.file.buffer,
        req.file.originalname,
        req.file.mimetype,
        req.file.size,
        validatedData
      );

      return res.status(201).json({
        success: true,
        data: document,
      });

    } catch (error: any) {
      if (error instanceof ZodError) {
        return res.status(400).json({
          success: false,
          errors: error.issues.map(i => ({
            field: i.path.join('.'),
            message: i.message,
          })),
        });
      }
      return res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }

  static async updateDocument(req: Request, res: Response) {
    try {
      const consumerId = req.user!.id;
      const documentId = Array.isArray(req.params['id'])
        ? req.params['id'][0]
        : req.params['id'];

      if (!documentId) {
        return res.status(400).json({
          success: false,
          message: 'Document ID is required.',
        });
      }

      const validatedData = updateDocumentSchema.parse(req.body);
      const document = await DocumentService.updateDocument(
        consumerId,
        documentId,
        validatedData
      );

      return res.status(200).json({
        success: true,
        data: document,
      });

    } catch (error: any) {
      if (error instanceof ZodError) {
        return res.status(400).json({
          success: false,
          errors: error.issues.map(i => ({
            field: i.path.join('.'),
            message: i.message,
          })),
        });
      }
      return res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }

  static async deleteDocument(req: Request, res: Response) {
    try {
      const consumerId = req.user!.id;
      const documentId = Array.isArray(req.params['id'])
        ? req.params['id'][0]
        : req.params['id'];

      if (!documentId) {
        return res.status(400).json({
          success: false,
          message: 'Document ID is required.',
        });
      }

      const result = await DocumentService.deleteDocument(
        consumerId,
        documentId
      );

      return res.status(200).json({
        success: true,
        ...result,
      });

    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }

  static async refreshDocumentUrl(req: Request, res: Response) {
    try {
      const consumerId = req.user!.id;
      const documentId = Array.isArray(req.params['id'])
        ? req.params['id'][0]
        : req.params['id'];

      if (!documentId) {
        return res.status(400).json({
          success: false,
          message: 'Document ID is required.',
        });
      }

      const result = await DocumentService.refreshDocumentUrl(
        consumerId,
        documentId
      );

      return res.status(200).json({
        success: true,
        data: result,
      });

    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }
}