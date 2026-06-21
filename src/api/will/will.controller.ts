// src/api/will/will.controller.ts

import type { Request, Response } from 'express';
import { WillService } from '../../services/will.service.js';
import {
  createWillSchema,
  updateWillSchema,
  createAssetSchema,
  updateAssetSchema,
  createBeneficiarySchema,
  updateBeneficiarySchema,
  saveDistributionSchema,
} from '../../validators/will.validator.js';
import { ZodError } from 'zod';

export class WillController {

  // --- Will Core ---

  static async getWill(req: Request, res: Response) {
    try {
      const consumerId = req.user!.id;
      const result = await WillService.getWill(consumerId);

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

  static async upsertWill(req: Request, res: Response) {
    try {
      const consumerId = req.user!.id;
      const validatedData = createWillSchema.parse(req.body);
      const will = await WillService.upsertWill(consumerId, validatedData);

      return res.status(200).json({
        success: true,
        data: will,
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

  // --- Assets ---

  static async createAsset(req: Request, res: Response) {
    try {
      const consumerId = req.user!.id;
      const validatedData = createAssetSchema.parse(req.body);
      const asset = await WillService.createAsset(consumerId, validatedData);

      return res.status(201).json({
        success: true,
        data: asset,
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

  static async updateAsset(req: Request, res: Response) {
    try {
      const consumerId = req.user!.id;
      const assetId = Array.isArray(req.params['id'])
        ? req.params['id'][0]
        : req.params['id'];

      if (!assetId) {
        return res.status(400).json({
          success: false,
          message: 'Asset ID is required.',
        });
      }

      const validatedData = updateAssetSchema.parse(req.body);
      const asset = await WillService.updateAsset(
        consumerId,
        assetId,
        validatedData
      );

      return res.status(200).json({
        success: true,
        data: asset,
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

  static async deleteAsset(req: Request, res: Response) {
    try {
      const consumerId = req.user!.id;
      const assetId = Array.isArray(req.params['id'])
        ? req.params['id'][0]
        : req.params['id'];

      if (!assetId) {
        return res.status(400).json({
          success: false,
          message: 'Asset ID is required.',
        });
      }

      const result = await WillService.deleteAsset(consumerId, assetId);

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

  // --- Beneficiaries ---

  static async createBeneficiary(req: Request, res: Response) {
    try {
      const consumerId = req.user!.id;
      const validatedData = createBeneficiarySchema.parse(req.body);
      const beneficiary = await WillService.createBeneficiary(
        consumerId,
        validatedData
      );

      return res.status(201).json({
        success: true,
        data: beneficiary,
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

  static async updateBeneficiary(req: Request, res: Response) {
    try {
      const consumerId = req.user!.id;
      const beneficiaryId = Array.isArray(req.params['id'])
        ? req.params['id'][0]
        : req.params['id'];

      if (!beneficiaryId) {
        return res.status(400).json({
          success: false,
          message: 'Beneficiary ID is required.',
        });
      }

      const validatedData = updateBeneficiarySchema.parse(req.body);
      const beneficiary = await WillService.updateBeneficiary(
        consumerId,
        beneficiaryId,
        validatedData
      );

      return res.status(200).json({
        success: true,
        data: beneficiary,
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

  static async deleteBeneficiary(req: Request, res: Response) {
    try {
      const consumerId = req.user!.id;
      const beneficiaryId = Array.isArray(req.params['id'])
        ? req.params['id'][0]
        : req.params['id'];

      if (!beneficiaryId) {
        return res.status(400).json({
          success: false,
          message: 'Beneficiary ID is required.',
        });
      }

      const result = await WillService.deleteBeneficiary(
        consumerId,
        beneficiaryId
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

  // --- PDF Generation ---

  static async generatePdf(req: Request, res: Response) {
    try {
      const consumerId = req.user!.id;
      const result = await WillService.generatePdf(consumerId);

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

  // --- Distribution ---

  static async saveDistribution(req: Request, res: Response) {
    try {
      const consumerId = req.user!.id;
      const validatedData = saveDistributionSchema.parse(req.body);
      const result = await WillService.saveDistribution(
        consumerId,
        validatedData
      );

      return res.status(200).json({
        success: true,
        ...result,
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

  static async getDistribution(req: Request, res: Response) {
    try {
      const consumerId = req.user!.id;
      const result = await WillService.getDistribution(consumerId);

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