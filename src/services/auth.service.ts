// src/services/auth.service.ts

import { supabase } from '../lib/supabase.js';
import type { RegisterInput, LoginInput } from '../validators/auth.validator.js';

export class AuthService {

  static async register(data: RegisterInput) {
    const { email, password, full_name, role } = data;

    // 1. Create the user in Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name, role }
    });

    if (authError) throw new Error(authError.message);

    const userId = authData.user.id;

    // 2. Update the role in profiles table
    // The DB trigger creates the profile row, we just update the role
    const { error: roleError } = await supabase
      .from('profiles')
      .upsert({
        id: userId,
        full_name: full_name,
        role: role,
    });

    if (roleError) {
      // If role update fails, clean up the created user
      // We don't want orphaned auth users with no profile
      await supabase.auth.admin.deleteUser(userId);
      throw new Error(`Failed to assign user role: ${roleError.message}`);
    }

    return {
      id: userId,
      email: authData.user.email,
      role,
      full_name,
    };
  }

  static async login(data: LoginInput) {
    const { email, password } = data;

    // Supabase handles all the heavy lifting here —
    // it checks the password, checks if user exists,
    // and returns a signed JWT session if everything is correct
    const { data: authData, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw new Error(error.message);

    // We return both the session and the user
    // The session contains the JWT token Flutter needs to store
    return {
      user: {
        id: authData.user.id,
        email: authData.user.email,
        full_name: authData.user.user_metadata?.['full_name'] as string,
        role: authData.user.user_metadata?.['role'] as string ?? 'family',
      },
      session: {
        access_token: authData.session.access_token,
        refresh_token: authData.session.refresh_token,
        expires_at: authData.session.expires_at,
      }
    };
  }
}