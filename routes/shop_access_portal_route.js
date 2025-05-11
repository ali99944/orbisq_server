import express from "express";
import {
    createPortalController,
    loginPortalController,
    getPortalsController,
    updatePortalController,
    // verifyPortalTokenController
} from "../controllers/shop_access_portal_controller.js";
import { authenticateOwner } from "../middlewares/shop_auth_middleware.js";

const router = express.Router();

// Public routes
router.post('/shop-portals/login', loginPortalController);
// router.get('/shop-portals/verify-token', verifyPortalTokenController);

// Owner-protected routes (only shop owner can create/update portals)
router.post('/shops/:shopId/portals', createPortalController);
router.get('/shops/:shopId/portals', getPortalsController);
router.put('/portals/:portalId', updatePortalController);

// Portal-authenticated routes
// (Add your shop management routes here that should be accessible by portal users)

export default router;