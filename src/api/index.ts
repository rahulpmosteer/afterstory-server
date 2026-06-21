
import { Router } from 'express';
import authRoutes from './auth/auth.routes.js';
import profileRoutes from './profiles/profile.routes.js';
import willRoutes from './will/will.routes.js';
import documentRoutes from './documents/document.routes.js';
import funeralRoutes from './funeral/funeral.routes.js';
import organRoutes from './organ/organ.routes.js';
import vendorRoutes from './vendor/vendor.routes.js';
import adminRoutes from './admin/admin.routes.js';
import marketplaceRoutes from './marketplace/marketplace.routes.js';
import paymentRoutes from './payment/payment.routes.js';
import ratingRoutes from './ratings/rating.routes.js';
// Future imports will go here:
// import medicalRoutes from './medical/medical.routes.js';

const router = Router();

// Versioning your API is a 20-year-tenure best practice
router.use('/auth', authRoutes);
router.use('/profile', profileRoutes);
router.use('/will', willRoutes);
router.use('/documents', documentRoutes);
router.use('/funeral', funeralRoutes);
router.use('/organ', organRoutes);
router.use('/vendor', vendorRoutes);
router.use('/admin', adminRoutes);
router.use('/marketplace', marketplaceRoutes);
router.use('/payment', paymentRoutes);
router.use('/ratings', ratingRoutes);
// When we build Stage 2:
// router.use('/onboarding', onboardingRoutes);

export default router;

/*
import express from 'express';
import type { Request, Response } from 'express';
import cors from 'cors';
import { supabase } from './lib/supabase.js';
//import dotenv from 'dotenv';

// 1. Load Environment Variables (.env)
//dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// 2. Middleware
app.use(cors()); // Allows Flutter to connect
app.use(express.json()); // Allows server to read JSON data

// 3. The "Handshake" Route
app.get('/hello', async (req: Request, res: Response) => {
  try {
    // A universal way to check if the DB is alive: 
    // Just ask for the current time from the Postgres server
    const { data, error } = await supabase.from('_non_existent_table_').select('count');
    
    // If the error is 'PGRST116' or similar, it actually means 
    // the connection works, but the table doesn't exist (which is fine!)
    // If the error is "FetchError", the connection is broken.
    
    const isConnected = !error || error.code !== 'FETCH_ERROR';

    res.json({
      status: "online",
      message: "AfterStory Sanctuary API is Active!",
      database: isConnected ? "Connected" : "Disconnected",
      debug: error ? error.message : "Handshake Successful"
    });
  } catch (err) {
    res.json({ status: "error", database: "Disconnected", message: String(err) });
  }
});

// 4. Start the Server
app.listen(PORT, () => {
  console.log(`🚀 Sanctuary Brain running on http://localhost:${PORT}`);
});

*/