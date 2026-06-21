// src/api/funeral/funeral.controller.ts

import type { Request, Response } from 'express';
import { FuneralService } from '../../services/funeral.service.js';
import { upsertFuneralPreferencesSchema } from '../../validators/funeral.validator.js';
import { ZodError } from 'zod';

export class FuneralController {

  static async getFuneralPreferences(req: Request, res: Response) {
    try {
      const consumerId = req.user!.id;
      const preferences = await FuneralService.getFuneralPreferences(
        consumerId
      );

      return res.status(200).json({
        success: true,
        data: preferences,
      });

    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }

  static async upsertFuneralPreferences(req: Request, res: Response) {
    try {
      const consumerId = req.user!.id;
      const validatedData = upsertFuneralPreferencesSchema.parse(
        req.body
      );
      const preferences = await FuneralService.upsertFuneralPreferences(
        consumerId,
        validatedData
      );

      return res.status(200).json({
        success: true,
        data: preferences,
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

  static async deleteFuneralPreferences(req: Request, res: Response) {
    try {
      const consumerId = req.user!.id;
      const result = await FuneralService.deleteFuneralPreferences(
        consumerId
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
}