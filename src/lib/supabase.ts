import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
//import path from 'path';

// This ensures we find the .env file even if we run from a different folder
dotenv.config(); 

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  //console.error("❌ Error: Supabase URL or Service Key is missing in .env");
  throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env');
}

export const supabase = createClient(
  supabaseUrl || '', 
  supabaseServiceKey || ''
);