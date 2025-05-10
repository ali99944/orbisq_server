import express from "express";
import {
    registerOwnerController,
    loginOwnerController,
    getOwnerController,
    updateOwnerController,
    verifyTokenController
} from "../controllers/shop_owner_controller.js";

const router = express.Router();

// Public routes
router.post('/shop-owners', registerOwnerController);
router.post('/shop-owners/login', loginOwnerController);
router.get('/verify-token', verifyTokenController);

// Protected routes
router.get('/me', getOwnerController);
router.put('/me', updateOwnerController);

export default router;