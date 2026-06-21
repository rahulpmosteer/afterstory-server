// src/api/marketplace/marketplace.controller.ts

import type { Request, Response } from 'express';
import { MarketplaceService } from '../../services/marketplace.service.js';
import {
  createListingSchema,
  updateListingSchema,
  createBookingSchema,
  updateBookingStatusSchema,
  updateCommissionSchema,
} from '../../validators/marketplace.validator.js';
import { ZodError } from 'zod';

export class MarketplaceController {

  // --- Listings ---

  static async getListings(req: Request, res: Response) {
    try {
      const category = req.query['category'] as string | undefined;
      const search = req.query['search'] as string | undefined;
      const latitude = req.query['latitude']
        ? parseFloat(req.query['latitude'] as string)
        : undefined;
      const longitude = req.query['longitude']
        ? parseFloat(req.query['longitude'] as string)
        : undefined;
      const radius = req.query['radius']
        ? parseInt(req.query['radius'] as string)
        : undefined;

      const filters: {
        category?: string;
        search?: string;
        latitude?: number;
        longitude?: number;
        radius_meters?: number;
      } = {};

      if (category !== undefined) filters.category = category;
      if (search !== undefined) filters.search = search;
      if (latitude !== undefined) filters.latitude = latitude;
      if (longitude !== undefined) filters.longitude = longitude;
      if (radius !== undefined) filters.radius_meters = radius;

      const listings = await MarketplaceService.getListings(filters);

      return res.status(200).json({
        success: true,
        data: listings,
      });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }

  static async getListing(req: Request, res: Response) {
    try {
      const listingId = Array.isArray(req.params['id'])
        ? req.params['id'][0]
        : req.params['id'];

      if (!listingId) {
        return res.status(400).json({
          success: false,
          message: 'Listing ID is required.',
        });
      }

      const listing = await MarketplaceService.getListing(listingId);
      return res.status(200).json({
        success: true,
        data: listing,
      });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }

  static async getVendorRevenue(req: Request, res: Response) {
    try {
      const vendorId = req.user!.id;
      const revenue = await MarketplaceService.getVendorRevenue(vendorId);
      return res.status(200).json({
        success: true,
        data: revenue,
      });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }

  static async getVendorListings(req: Request, res: Response) {
    try {
      const vendorId = req.user!.id;
      const listings =
        await MarketplaceService.getVendorListings(vendorId);
      return res.status(200).json({
        success: true,
        data: listings,
      });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }

  static async createListing(req: Request, res: Response) {
    try {
      const vendorId = req.user!.id;
      const validatedData = createListingSchema.parse(req.body);
      const listing = await MarketplaceService.createListing(
        vendorId,
        validatedData
      );
      return res.status(201).json({
        success: true,
        data: listing,
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

  static async updateListing(req: Request, res: Response) {
    try {
      const vendorId = req.user!.id;
      const listingId = Array.isArray(req.params['id'])
        ? req.params['id'][0]
        : req.params['id'];

      if (!listingId) {
        return res.status(400).json({
          success: false,
          message: 'Listing ID is required.',
        });
      }

      const validatedData = updateListingSchema.parse(req.body);
      const listing = await MarketplaceService.updateListing(
        vendorId,
        listingId,
        validatedData
      );
      return res.status(200).json({
        success: true,
        data: listing,
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

  static async deleteListing(req: Request, res: Response) {
    try {
      const vendorId = req.user!.id;
      const listingId = Array.isArray(req.params['id'])
        ? req.params['id'][0]
        : req.params['id'];

      if (!listingId) {
        return res.status(400).json({
          success: false,
          message: 'Listing ID is required.',
        });
      }

      const result = await MarketplaceService.deleteListing(
        vendorId,
        listingId
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

  // --- Bookings ---

  static async createBooking(req: Request, res: Response) {
    try {
      const consumerId = req.user!.id;
      const validatedData = createBookingSchema.parse(req.body);
      const booking = await MarketplaceService.createBooking(
        consumerId,
        validatedData
      );
      return res.status(201).json({
        success: true,
        data: booking,
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

  static async getConsumerBookings(req: Request, res: Response) {
    try {
      const consumerId = req.user!.id;
      const bookings =
        await MarketplaceService.getConsumerBookings(consumerId);
      return res.status(200).json({
        success: true,
        data: bookings,
      });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }

  static async getVendorBookings(req: Request, res: Response) {
    try {
      const vendorId = req.user!.id;
      const bookings =
        await MarketplaceService.getVendorBookings(vendorId);
      return res.status(200).json({
        success: true,
        data: bookings,
      });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }

  static async updateBookingStatus(req: Request, res: Response) {
    try {
      const userId = req.user!.id;
      const bookingId = Array.isArray(req.params['id'])
        ? req.params['id'][0]
        : req.params['id'];

      if (!bookingId) {
        return res.status(400).json({
          success: false,
          message: 'Booking ID is required.',
        });
      }

      const validatedData = updateBookingStatusSchema.parse(req.body);
      const booking = await MarketplaceService.updateBookingStatus(
        userId,
        bookingId,
        validatedData
      );
      return res.status(200).json({
        success: true,
        data: booking,
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

  // --- Commission ---

  static async getCommissionConfig(req: Request, res: Response) {
    try {
      const config = await MarketplaceService.getCommissionConfig();
      return res.status(200).json({
        success: true,
        data: config,
      });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }

  static async updateCommission(req: Request, res: Response) {
    try {
      if (req.user?.role !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'Only admins can update commission rates.',
        });
      }

      const validatedData = updateCommissionSchema.parse(req.body);
      const config = await MarketplaceService.updateCommission(
        req.user.id,
        validatedData
      );
      return res.status(200).json({
        success: true,
        data: config,
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