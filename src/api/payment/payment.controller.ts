// src/api/payment/payment.controller.ts

import type { Request, Response } from 'express';
import { PaymentService } from '../../services/payment.service.js';
import {
  createPaymentOrderSchema,
  verifyPaymentSchema,
} from '../../validators/payment.validator.js';
import { ZodError } from 'zod';

export class PaymentController {

  static async createPaymentOrder(req: Request, res: Response) {
    try {
      const consumerId = req.user!.id;
      const validatedData = createPaymentOrderSchema.parse(req.body);
      const order = await PaymentService.createPaymentOrder(
        consumerId,
        validatedData
      );

      return res.status(201).json({
        success: true,
        data: order,
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

  static async verifyPayment(req: Request, res: Response) {
    try {
      const consumerId = req.user!.id;
      const validatedData = verifyPaymentSchema.parse(req.body);
      const result = await PaymentService.verifyPayment(
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

  static async getPaymentHistory(req: Request, res: Response) {
    try {
      const consumerId = req.user!.id;
      const history = await PaymentService.getPaymentHistory(
        consumerId
      );

      return res.status(200).json({
        success: true,
        data: history,
      });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }
}