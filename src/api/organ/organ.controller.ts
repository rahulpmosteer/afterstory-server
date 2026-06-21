// src/api/organ/organ.controller.ts

import type { Request, Response } from 'express';
import { OrganService } from '../../services/organ.service.js';
import { upsertOrganDonationSchema } from '../../validators/organ.validator.js';
import { ZodError } from 'zod';

export class OrganController {

  static async getOrganDonationPledge(req: Request, res: Response) {
    try {
      const consumerId = req.user!.id;
      const pledge = await OrganService.getOrganDonationPledge(
        consumerId
      );

      return res.status(200).json({
        success: true,
        data: pledge,
      });

    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }

  static async upsertOrganDonationPledge(req: Request, res: Response) {
    try {
      const consumerId = req.user!.id;
      const validatedData = upsertOrganDonationSchema.parse(req.body);
      const pledge = await OrganService.upsertOrganDonationPledge(
        consumerId,
        validatedData
      );

      return res.status(200).json({
        success: true,
        data: pledge,
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

  static async deleteOrganDonationPledge(req: Request, res: Response) {
    try {
      const consumerId = req.user!.id;
      const result = await OrganService.deleteOrganDonationPledge(
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