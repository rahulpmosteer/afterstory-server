// src/api/vendor/vendor.controller.ts

import type { Request, Response } from 'express';
import { VendorService } from '../../services/vendor.service.js';
import { upsertVendorMetadataSchema } from '../../validators/vendor.validator.js';
import { ZodError } from 'zod';

export class VendorController {

  static async getVendorProfile(req: Request, res: Response) {
    try {
      const vendorId = req.user!.id;
      const result = await VendorService.getVendorProfile(vendorId);

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

  static async upsertVendorMetadata(req: Request, res: Response) {
    try {
      const vendorId = req.user!.id;
      const validatedData = upsertVendorMetadataSchema.parse(req.body);
      const metadata = await VendorService.upsertVendorMetadata(
        vendorId,
        validatedData
      );

      return res.status(200).json({
        success: true,
        data: metadata,
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

  static async getOnboardingStatus(req: Request, res: Response) {
    try {
      const vendorId = req.user!.id;
      const status = await VendorService.getOnboardingStatus(vendorId);

      return res.status(200).json({
        success: true,
        data: status,
      });

    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }
}