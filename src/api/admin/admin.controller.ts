// src/api/admin/admin.controller.ts

import type { Request, Response } from 'express';
import { AdminService } from '../../services/admin.service.js';
import { ZodError, z } from 'zod';

const reviewServiceSchema = z.object({
  status: z.enum(['approved', 'rejected']),
  rejection_reason: z.string().optional(),
});

export class AdminController {

  // Middleware check — only admins can access
  static requireAdmin(req: Request, res: Response, next: any) {
    console.log('requireAdmin check — user:', req.user);
    console.log('requireAdmin check — role:', req.user?.role);
    if (req.user?.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin only.',
      });
    }
    next();
  }

  static async getStats(req: Request, res: Response) {
    try {
      const stats = await AdminService.getStats();
      return res.status(200).json({
        success: true,
        data: stats,
      });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }

  static async getAllVendorServices(req: Request, res: Response) {
    try {
      const services = await AdminService.getAllVendorServices();
      return res.status(200).json({ success: true, data: services });
    } catch (error: any) {
      return res.status(500).json({ success: false, message: error.message });
    }
  }

  static async getPendingServices(req: Request, res: Response) {
    try {
      const services = await AdminService.getPendingServices();
      return res.status(200).json({
        success: true,
        data: services,
      });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }

  static async getAllVendors(req: Request, res: Response) {
    try {
      const vendors = await AdminService.getAllVendors();
      return res.status(200).json({
        success: true,
        data: vendors,
      });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }

  static async getAllUsers(req: Request, res: Response) {
    try {
      const users = await AdminService.getAllUsers();
      return res.status(200).json({
        success: true,
        data: users,
      });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }

  static async reviewService(req: Request, res: Response) {
    try {
      const adminId = req.user!.id;
      const serviceId = Array.isArray(req.params['id'])
        ? req.params['id'][0]
        : req.params['id'];

      if (!serviceId) {
        return res.status(400).json({
          success: false,
          message: 'Service ID is required.',
        });
      }

      const validatedData = reviewServiceSchema.parse(req.body);
      const service = await AdminService.reviewVendorService(
        adminId,
        serviceId,
        validatedData.status,
        validatedData.rejection_reason
      );

      return res.status(200).json({
        success: true,
        data: service,
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
}