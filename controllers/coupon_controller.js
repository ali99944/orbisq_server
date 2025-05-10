import {
    createCouponService,
    getAllCouponsService,
    getCouponByIdService,
    getCouponByCodeService,
    updateCouponService,
    deleteCouponService,
    addProductRestrictionToCouponService,
    removeProductRestrictionFromCouponService
} from "../services/coupon_service.js";
import asyncWrapper from "../utils/wrappers/async_wrapper.js";
import { CREATED, OK } from "../utils/status_codes.js";

export const createCouponController = asyncWrapper(
    async (req, res) => {
        const coupon = await createCouponService(req.body);
        return res.status(CREATED).json(coupon);
    }
);

export const getAllCouponsController = asyncWrapper(
    async (req, res) => {
        const coupons = await getAllCouponsService(req.query);
        return res.json(coupons);
    }
);

export const getCouponByIdController = asyncWrapper(
    async (req, res) => {
        const { id } = req.params;
        const coupon = await getCouponByIdService(id);
        return res.json(coupon);
    }
);

export const getCouponByCodeController = asyncWrapper(
    async (req, res) => {
        const { code } = req.params;
        const coupon = await getCouponByCodeService(code);
        return res.json(coupon);
    }
);

export const updateCouponController = asyncWrapper(
    async (req, res) => {
        const { id } = req.params;
        const updatedCoupon = await updateCouponService(id, req.body);
        return res.json(updatedCoupon);
    }
);

export const deleteCouponController = asyncWrapper(
    async (req, res) => {
        const { id } = req.params;
        const result = await deleteCouponService(id);
        return res.json(result);
    }
);


// --- Controllers for Coupon Relations ---
export const addProductRestrictionController = asyncWrapper(
    async (req, res) => {
        const { couponId, productId } = req.params;
        const coupon = await addProductRestrictionToCouponService(couponId, productId);
        return res.status(OK).json(coupon);
    }
);

export const removeProductRestrictionController = asyncWrapper(
    async (req, res) => {
        const { couponId, productId } = req.params;
        const coupon = await removeProductRestrictionFromCouponService(couponId, productId);
        return res.status(OK).json(coupon);
    }
);