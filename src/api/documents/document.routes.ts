// src/api/documents/document.routes.ts

import { Router } from 'express';
import multer from 'multer';
import { DocumentController } from './document.controller.js';
import { requireAuth } from '../../middleware/auth.middleware.js';

const router = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 20 * 1024 * 1024, // 20MB — matches bucket policy
  },
  fileFilter: (_req, file, callback) => {
    const allowedTypes = [
      'application/pdf',
      'image/jpeg',
      'image/png',
      'image/webp',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ];
    if (allowedTypes.includes(file.mimetype)) {
      callback(null, true);
    } else {
      callback(
        new Error('Only PDF, JPG, PNG, WebP and Word documents are allowed.')
      );
    }
  },
});

// --- Document Routes ---
router.get('/', requireAuth, DocumentController.getDocuments);
router.get('/:id', requireAuth, DocumentController.getDocument);
router.post(
  '/',
  requireAuth,
  upload.single('file'),
  DocumentController.uploadDocument
);
router.put('/:id', requireAuth, DocumentController.updateDocument);
router.delete('/:id', requireAuth, DocumentController.deleteDocument);
router.post(
  '/:id/refresh-url',
  requireAuth,
  DocumentController.refreshDocumentUrl
);

export default router;