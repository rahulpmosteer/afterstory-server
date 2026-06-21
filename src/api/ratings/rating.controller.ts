// src/api/ratings/rating.controller.ts

import type { Request, Response } from 'express';
import { RatingService } from '../../services/rating.service.js';
import { createRatingSchema } from '../../validators/rating.validator.js';
import { ZodError } from 'zod';

export class RatingController {

  static async createRating(req: Request, res: Response) {
    try {
      const consumerId = req.user!.id;
      const validatedData = createRatingSchema.parse(req.body);
      const rating = await RatingService.createRating(
        consumerId,
        validatedData
      );

      return res.status(201).json({
        success: true,
        data: rating,
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

  static async getVendorRatings(req: Request, res: Response) {
    try {
      const vendorId = Array.isArray(req.params['vendorId'])
        ? req.params['vendorId'][0]
        : req.params['vendorId'];

      if (!vendorId) {
        return res.status(400).json({
          success: false,
          message: 'Vendor ID is required.',
        });
      }

      const result = await RatingService.getVendorRatings(vendorId);
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

  static async getBookingRating(req: Request, res: Response) {
    try {
      const consumerId = req.user!.id;
      const bookingId = Array.isArray(req.params['bookingId'])
        ? req.params['bookingId'][0]
        : req.params['bookingId'];

      if (!bookingId) {
        return res.status(400).json({
          success: false,
          message: 'Booking ID is required.',
        });
      }

      const rating = await RatingService.getBookingRating(
        consumerId,
        bookingId
      );

      return res.status(200).json({
        success: true,
        data: rating,
      });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }
}