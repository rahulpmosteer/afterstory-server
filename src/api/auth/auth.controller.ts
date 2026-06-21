// src/auth/auth.controller.ts

import type { Request, Response } from 'express';
import { AuthService } from '../../services/auth.service.js';
import { registerSchema, loginSchema } from '../../validators/auth.validator.js';
import { ZodError } from 'zod';

export class AuthController {

  static async register(req: Request, res: Response) {
    try {
      const validatedData = registerSchema.parse(req.body);
      const result = await AuthService.register(validatedData);

      return res.status(201).json({
        success: true,
        message: 'Welcome to AfterStory. Your account has been created.',
        data: result
      });

    } catch (error: any) {
      if (error instanceof ZodError) {
        return res.status(400).json({
          success: false,
          message: 'Input validation failed',
          errors: error.issues.map(issue => ({
            field: issue.path.join('.'),
            message: issue.message
          }))
        });
      }

      const statusCode = error.message.includes('Invalid login credentials') ? 401 : 400;
      
      return res.status(statusCode).json({
      success: false,
      message: error.message
    });
    /*
      return res.status(500).json({
        success: false,
        message: error.message || 'An unexpected error occurred'
      });*/
    }
  }

  static async login(req: Request, res: Response) {
    try {
      // 1. Validate the request body
      const validatedData = loginSchema.parse(req.body);

      // 2. Call the service
      const result = await AuthService.login(validatedData);

      // 3. Return the session to Flutter
      // Flutter will store the access_token and send it
      // with every future request
      return res.status(200).json({
        success: true,
        message: 'Login successful. Welcome back.',
        data: result
      });

    } catch (error: any) {
      if (error instanceof ZodError) {
        return res.status(400).json({
          success: false,
          message: 'Input validation failed',
          errors: error.issues.map(issue => ({
            field: issue.path.join('.'),
            message: issue.message
          }))
        });
      }

      // Supabase returns "Invalid login credentials" for wrong
      // email/password — we pass that message through directly
      return res.status(401).json({
        success: false,
        message: error.message || 'Login failed'
      });
    }
  }
}