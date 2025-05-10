import express from "express";
import {
    createPortalController,
    loginPortalController,
    getPortalsController,
    updatePortalController,
    verifyPortalTokenController
} from "../controllers/shop_access_portal_controller.js";
import { authenticateOwner } from "../middlewares/shop_auth_middleware.js";

const router = express.Router();

// Public routes
router.post('/login', loginPortalController);
router.get('/verify-token', verifyPortalTokenController);

// Owner-protected routes (only shop owner can create/update portals)
router.post('/shops/:shopId/portals', authenticateOwner, createPortalController);
router.get('/shops/:shopId/portals', authenticateOwner, getPortalsController);
router.put('/portals/:portalId', authenticateOwner, updatePortalController);

// Portal-authenticated routes
// (Add your shop management routes here that should be accessible by portal users)

export default router;