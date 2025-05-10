import {
    createDiscountService,
    getAllDiscountsService,
    getDiscountByIdService,
    updateDiscountService,
    deleteDiscountService
} from "../services/discount_service.js";
import asyncWrapper from "../utils/wrappers/async_wrapper.js";
import { CREATED } from "../utils/status_codes.js";

export const createDiscountController = asyncWrapper(
    async (req, res) => {
        const discount = await createDiscountService(req.body);
        return res.status(CREATED).json(discount);
    }
);

export const getAllDiscountsController = asyncWrapper(
    async (req, res) => {
        const discounts = await getAllDiscountsService(req.query);
        return res.json(discounts);
    }
);

export const getDiscountByIdController = asyncWrapper(
    async (req, res) => {
        const { id } = req.params;
        const discount = await getDiscountByIdService(id);
        return res.json(discount);
    }
);

export const updateDiscountController = asyncWrapper(
    async (req, res) => {
        const { id } = req.params;
        const updatedDiscount = await updateDiscountService(id, req.body);
        return res.json(updatedDiscount);
    }
);

export const deleteDiscountController = asyncWrapper(
    async (req, res) => {
        const { id } = req.params;
        const result = await deleteDiscountService(id);
        return res.json(result);
    }
);