// src/profiles/profile.controller.ts

import type { Request, Response } from 'express';
//import multer from 'multer';
import { ProfileService } from '../../services/profile.service.js';
import {
  vendorOnboardingSchema,
  consumerOnboardingSchema,
  updateProfileSchema,
  updateConsumerMetadataSchema,
  createNomineeSchema,
  updateNomineeSchema,
  vendorServiceSchema,
  reviewVendorServiceSchema,
} from '../../validators/profile.validator.js';
import { ZodError } from 'zod';

export class ProfileController {

  // --- Existing Method ---

  static async completeOnboarding(req: Request, res: Response) {
    try {
      const { role } = req.body;
      const userId = req.user!.id;

      if (role === 'vendor') {
        const validatedData = vendorOnboardingSchema.parse(req.body.details);
        const result = await ProfileService.updateVendorMetadata(userId, validatedData);
        return res.status(200).json({ success: true, ...result });
      }

      if (role === 'family') {
        const validatedData = consumerOnboardingSchema.parse(req.body.details);
        const result = await ProfileService.updateConsumerMetadata(userId, validatedData);
        return res.status(200).json({ success: true, ...result });
      }

      return res.status(400).json({
        success: false,
        message: "Invalid role for onboarding."
      });

    } catch (error: any) {
      if (error instanceof ZodError) {
        return res.status(400).json({
          success: false,
          errors: error.issues.map(i => ({
            field: i.path.join('.'),
            message: i.message
          }))
        });
      }
      return res.status(500).json({ success: false, message: error.message });
    }
  }

  // --- New Methods ---

  static async getProfile(req: Request, res: Response) {
    try {
      const userId = req.user!.id;
      const result = await ProfileService.getProfile(userId);

      return res.status(200).json({
        success: true,
        data: result,
      });

    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  static async updateProfile(req: Request, res: Response) {
    try {
      const userId = req.user!.id;
      const validatedData = updateProfileSchema.parse(req.body);
      const result = await ProfileService.updateProfile(userId, validatedData);

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
            message: i.message
          }))
        });
      }
      return res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  static async updatePersonalMetadata(req: Request, res: Response) {
    try {
      const userId = req.user!.id;
      const validatedData = updateConsumerMetadataSchema.parse(req.body);
      const result = await ProfileService.updatePersonalMetadata(
        userId,
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
            message: i.message
          }))
        });
      }
      return res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  static async uploadProfilePhoto(req: Request, res: Response) {
    try {
      const userId = req.user!.id;

      // req.file comes from multer middleware
      // we'll add multer to the routes file
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: 'No photo provided.'
        });
      }

      const result = await ProfileService.uploadProfilePhoto(
        userId,
        req.file.buffer,
        req.file.mimetype,
      );

      return res.status(200).json({
        success: true,
        data: result,
      });

    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // --- Nominee Handlers ---

  static async getNominees(req: Request, res: Response) {
    try {
      const userId = req.user!.id;
      const nominees = await ProfileService.getNominees(userId);

      return res.status(200).json({
        success: true,
        data: nominees,
      });

    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  static async createNominee(req: Request, res: Response) {
    try {
      const userId = req.user!.id;
      const validatedData = createNomineeSchema.parse(req.body);
      const nominee = await ProfileService.createNominee(userId, validatedData);

      return res.status(201).json({
        success: true,
        data: nominee,
      });

    } catch (error: any) {
      if (error instanceof ZodError) {
        return res.status(400).json({
          success: false,
          errors: error.issues.map(i => ({
            field: i.path.join('.'),
            message: i.message
          }))
        });
      }
      return res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  static async updateNominee(req: Request, res: Response) {
    try {
      const userId = req.user!.id;
      const nomineeId = Array.isArray(req.params['id']) 
  ? req.params['id'][0] 
  : req.params['id'];

      if (!nomineeId) {
        return res.status(400).json({
          success: false,
          message: 'Nominee ID is required.'
        });
      }

      const validatedData = updateNomineeSchema.parse(req.body);
      const nominee = await ProfileService.updateNominee(
        userId,
        nomineeId,
        validatedData
      );

      return res.status(200).json({
        success: true,
        data: nominee,
      });

    } catch (error: any) {
      if (error instanceof ZodError) {
        return res.status(400).json({
          success: false,
          errors: error.issues.map(i => ({
            field: i.path.join('.'),
            message: i.message
          }))
        });
      }
      return res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  static async deleteNominee(req: Request, res: Response) {
    try {
      const userId = req.user!.id;
      const nomineeId = Array.isArray(req.params['id']) 
  ? req.params['id'][0] 
  : req.params['id'];

      if (!nomineeId) {
        return res.status(400).json({
          success: false,
          message: 'Nominee ID is required.'
        });
      }

      const result = await ProfileService.deleteNominee(userId, nomineeId);

      return res.status(200).json({
        success: true,
        ...result,
      });

    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  static async getVendorProfile(req: Request, res: Response) {
  try {
    const vendorId = req.user!.id;
    const result = await ProfileService.getVendorProfile(vendorId);

    return res.status(200).json({
      success: true,
      data: result,
    });

  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
}

static async getVendorServices(req: Request, res: Response) {
  try {
    const vendorId = req.user!.id;
    const services = await ProfileService.getVendorServices(vendorId);

    return res.status(200).json({
      success: true,
      data: services,
    });

  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
}

static async addVendorService(req: Request, res: Response) {
  try {
    const vendorId = req.user!.id;
    const validatedData = vendorServiceSchema.parse(req.body);
    const service = await ProfileService.addVendorService(vendorId, validatedData);

    return res.status(201).json({
      success: true,
      data: service,
    });

  } catch (error: any) {
    if (error instanceof ZodError) {
      return res.status(400).json({
        success: false,
        errors: error.issues.map(i => ({
          field: i.path.join('.'),
          message: i.message
        }))
      });
    }
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
}

static async removeVendorService(req: Request, res: Response) {
  try {
    const vendorId = req.user!.id;
    const serviceId = Array.isArray(req.params['id'])
      ? req.params['id'][0]
      : req.params['id'];

    if (!serviceId) {
      return res.status(400).json({
        success: false,
        message: 'Service ID is required.'
      });
    }

    const result = await ProfileService.removeVendorService(vendorId, serviceId);

    return res.status(200).json({
      success: true,
      ...result,
    });

  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
}

static async reviewVendorService(req: Request, res: Response) {
  try {
    // Only admins can review — we check role from the token
    if (req.user!.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Only admins can review vendor services.'
      });
    }

    const adminId = req.user!.id;
    const serviceId = Array.isArray(req.params['id'])
      ? req.params['id'][0]
      : req.params['id'];

    if (!serviceId) {
      return res.status(400).json({
        success: false,
        message: 'Service ID is required.'
      });
    }

    const validatedData = reviewVendorServiceSchema.parse(req.body);
    const service = await ProfileService.reviewVendorService(
      adminId,
      serviceId,
      validatedData
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
          message: i.message
        }))
      });
    }
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
}
}