// src/middleware/auth.middleware.ts

import type { Request, Response, NextFunction } from 'express';
import { supabase } from '../lib/supabase.js';

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        role: string;
      };
    }
  }
}

export const requireAuth = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'No token provided. Please log in.'
      });
    }

    const token = authHeader.split(' ')[1];

    const { data, error } = await supabase.auth.getUser(token);

    if (error || !data.user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired token. Please log in again.'
      });
    }

    // Fetch role from profiles table
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', data.user.id)
      .single();

    // Attach verified user to request
    req.user = {
      id: data.user.id,
      email: data.user.email ?? '',
      role: profile?.role ?? 'family',
    };

    next();

  } catch (error: any) {
    return res.status(401).json({
      success: false,
      message: 'Authentication failed.'
    });
  }
};