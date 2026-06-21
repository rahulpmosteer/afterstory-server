import express from 'express';
import type { Application } from 'express';
import dotenv from 'dotenv';
import apiRouter from './api/index.js';

dotenv.config();

const app: Application = express();

// Global Middleware
app.use(express.json());

// Central Routing Hub
// All Afterstory APIs will now start with /api/v1
app.use('/api/v1', apiRouter);

// Health Check (Good for load balancers)
app.get('/health', (_req, res) => {
  res.status(200).json({ status: "Afterstory Core is Online" });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Afterstory 2026 Engine running at http://localhost:${PORT}/api/v1`);
});