import express from "express";
import {
    createCouponController,
    getAllCouponsController,
    getCouponByIdController,
    getCouponByCodeController,
    updateCouponController,
    deleteCouponController,
    addProductRestrictionController,
    removeProductRestrictionController
} from "../controllers/coupon_controller.js";
import { authenticatePortal } from "../middlewares/shop_auth_middleware.js";

const router = express.Router();

router.post('/coupons', authenticatePortal, createCouponController);
router.get('/coupons', getAllCouponsController);
router.get('/coupons/id/:id', getCouponByIdController); // Differentiate path for ID
router.get('/coupons/code/:code', getCouponByCodeController); // Differentiate path for code
router.put('/coupons/:id', updateCouponController);
router.delete('/coupons/:id', deleteCouponController);

// Routes for managing coupon product restrictions
router.post('/coupons/:couponId/restrictions/products/:productId', addProductRestrictionController);
router.delete('/coupons/:couponId/restrictions/products/:productId', removeProductRestrictionController);

// You would add similar routes for user restrictions:
// router.post('/coupons/:couponId/restrictions/users/:userId', addUserRestrictionController);
// router.delete('/coupons/:couponId/restrictions/users/:userId', removeUserRestrictionController);


export default router;